"use server";

import { NextResponse } from "next/server";
import axios from "axios";
import { Readable } from "stream";
import { spawn } from "child_process";
import FormData from "form-data";
import { MongoClient, ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { srtToSecondsTimestamp } from "@/lib/srt_to_second";
import { secondsToSrtTimestamp } from "@/lib/second_to_srt";
import { languages } from "@/lib/languages";

const WHISPER_API_URL = "https://api.openai.com/v1/audio/transcriptions";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DB_NAME || "magicsub_db");
  }
  return db;
}

const formatLanguage = (value) => {
  const lang = languages.find((l) => l.value === value);
  return lang ? lang.label : value;
};

const formatSrtFile = (data, lastSecond) => {
  const array = data.split("\n\n");
  const formattedData = [];
  for (let i = 0; i < array.length - 1; i++) {
    const items = array[i].split("\n");

    const updatedStart =
      srtToSecondsTimestamp(items[1].split(" --> ")[0]) + lastSecond;

    const updatedEnd =
      srtToSecondsTimestamp(items[1].split(" --> ")[1]) + lastSecond;

    const segment = {
      index: uuidv4(),
      start: secondsToSrtTimestamp(updatedStart),
      end: secondsToSrtTimestamp(updatedEnd),
      text: items[2],
    };
    formattedData.push(segment);
  }

  return {
    formattedData,
    lastSecond: srtToSecondsTimestamp(
      formattedData[formattedData.length - 1].end
    ),
  };
};

async function extractAudioSegment(buffer, start, duration) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      "pipe:0",
      "-ss",
      start.toString(),
      "-t",
      duration.toString(),
      "-f",
      "mp3",
      "-acodec",
      "libmp3lame",
      "pipe:1",
    ]);
    const chunks = [];
    ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on("data", (d) => console.log("ffmpeg:", d.toString()));
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
    Readable.from(buffer).pipe(ffmpeg.stdin);
  });
}

async function translateSegments(segments, targetLanguage) {
  const batchSize = 40; // số câu mỗi lần gửi, tùy chỉnh theo nhu cầu
  const result = [];

  for (let i = 0; i < segments.length; i += batchSize) {
    const batch = segments.slice(i, i + batchSize);
    const texts = batch.map((s) => s.text);

    const systemPrompt = `You are a professional translator. Your task is to translate an array of subtitles into ${formatLanguage(
      targetLanguage
    )}.
- Keep the number of elements exactly the same as the input.
- Each element in the output must correspond to the same element in the input.
- Translate naturally and fluently, as if written by a native speaker.
- Do NOT merge, split, or omit any sentences.
- If the output array would have fewer elements than the input,
  repeat the missing elements untranslated to preserve array length.
- Return ONLY a valid JSON array of translated strings, with no extra text.`;

    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(texts) },
        ],
        temperature: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let translatedArray;
    try {
      translatedArray = JSON.parse(res.data.choices[0].message.content.trim());
    } catch (e) {
      console.error("Error parsing translation:", e);
      throw new Error("Failed to parse translation response");
    }

    // Nếu thiếu phần tử, tự chèn câu gốc cho đủ
    if (translatedArray.length !== batch.length) {
      console.warn(
        `Mismatch: expected ${batch.length}, got ${translatedArray.length}`
      );
      while (translatedArray.length < batch.length) {
        translatedArray.push(batch[translatedArray.length].text);
      }
    }

    batch.forEach((s, idx) => {
      result.push({
        ...s,
        text: translatedArray[idx] || s.text,
      });
    });
  }

  return result;
}

export async function POST(req) {
  const session = client.startSession();
  try {
    const {
      cloudUrl,
      _id,
      sourceLanguage,
      targetLanguage,
      userId,
      duration,
      cost,
    } = await req.json();

    if (
      !cloudUrl ||
      !_id ||
      !sourceLanguage ||
      !targetLanguage ||
      !userId ||
      !duration ||
      !cost
    ) {
      return NextResponse.json(
        { message: "Missing parameters" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const users = db.collection("users");
    const subtitles = db.collection("subtitle");

    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ message: "User not found!" }, { status: 404 });
    }
    if ((user.gems || 0) < cost) {
      return NextResponse.json(
        { message: "Not enough gems to process request!" },
        { status: 400 }
      );
    }

    const response = await axios.get(cloudUrl, { responseType: "arraybuffer" });
    const audioBuffer = Buffer.from(response.data);

    const segmentDuration = 240;
    const totalDuration = duration;
    const segments = [];
    let lastSecond = 0;

    for (let start = 0; start < totalDuration; start += segmentDuration) {
      const segmentBuffer = await extractAudioSegment(
        audioBuffer,
        start,
        segmentDuration
      );

      const form = new FormData();
      form.append("file", segmentBuffer, {
        filename: `chunk_${start}.mp3`,
        contentType: "audio/mp3",
      });
      form.append("model", "whisper-1");
      form.append("response_format", "srt");
      if (sourceLanguage !== "auto") {
        form.append("language", sourceLanguage);
      }

      const whisperRes = await axios.post(WHISPER_API_URL, form, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          ...form.getHeaders(),
        },
      });

      const formattedSrt = formatSrtFile(whisperRes.data, lastSecond);
      lastSecond = formattedSrt.lastSecond;
      segments.push(...formattedSrt.formattedData);
    }

    const translatedSegments = await translateSegments(
      segments,
      targetLanguage
    );

    let result;
    await session.withTransaction(async () => {
      await users.updateOne(
        { _id: new ObjectId(userId) },
        { $inc: { gems: -cost } },
        { session }
      );

      result = await subtitles.insertOne(
        {
          language: targetLanguage,
          userId: new ObjectId(userId),
          videoId: new ObjectId(_id),
          subtitle: translatedSegments,
        },
        { session }
      );
    });

    return NextResponse.json({
      message: "Transcript segments saved with translation",
      subtitle: translatedSegments,
      subtitleId: result.insertedId,
      language: targetLanguage,
    });
  } catch (err) {
    console.error("Error processing video:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  } finally {
    await session.endSession();
  }
}