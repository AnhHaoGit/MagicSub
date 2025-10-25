"use server";

import { NextResponse } from "next/server";
import axios from "axios";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import { MongoClient, ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { srtToSecondsTimestamp } from "@/lib/srt_to_second";
import { secondsToSrtTimestamp } from "@/lib/second_to_srt";
import { languages } from "@/lib/languages";
import crypto from "crypto";

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

const formatSrtFile = (data, offset) => {
  const array = data.split("\n\n");
  const formattedData = [];

  for (let i = 0; i < array.length - 1; i++) {
    const items = array[i].split("\n");
    if (items.length < 3) continue;

    const startTime = srtToSecondsTimestamp(items[1].split(" --> ")[0]);
    const endTime = srtToSecondsTimestamp(items[1].split(" --> ")[1]);

    const updatedStart = startTime + offset;
    const updatedEnd = endTime + offset;

    formattedData.push({
      index: uuidv4(),
      start: secondsToSrtTimestamp(updatedStart),
      end: secondsToSrtTimestamp(updatedEnd),
      text: items.slice(2).join(" "),
    });
  }

  return formattedData;
};

async function extractAudioSegment(filePath, start, duration) {
  const tempAudioPath = path.join(
    "/tmp",
    `segment_${start}_${uuidv4()}_${crypto.randomBytes(4).toString("hex")}.mp3`
  );

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-ss",
      start.toString(),
      "-t",
      duration.toString(),
      "-i",
      filePath,
      "-vn",
      "-acodec",
      "libmp3lame",
      "-b:a",
      "320k",
      "-ar",
      "48000",
      "-q:a",
      "2",
      "-f",
      "mp3",
      tempAudioPath,
    ]);

    ffmpeg.stderr.on("data", (d) => console.log("ffmpeg:", d.toString()));
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve(tempAudioPath);
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

async function translateSegments(segments, targetLanguage) {
  const batchSize = 40;
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
      translatedArray = JSON.parse(
        res.data.choices[0].message.content.trim().replace(/```json|```/g, "")
      );
    } catch (e) {
      console.error("Error parsing translation:", e);
      throw new Error("Failed to parse translation response");
    }

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
  const tempFiles = [];
  let tempVideoPath = null;

  try {
    const {
      cloudUrl,
      _id,
      sourceLanguage,
      targetLanguage,
      userId,
      cost,
      endpoints,
    } = await req.json();

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

    tempVideoPath = path.join(
      "/tmp",
      `temp_${Date.now()}_${uuidv4()}_${crypto
        .randomBytes(4)
        .toString("hex")}.mp4`
    );
    tempFiles.push(tempVideoPath);

    const videoResponse = await axios.get(cloudUrl, {
      responseType: "arraybuffer",
    });
    fs.writeFileSync(tempVideoPath, videoResponse.data);

    const segmentDuration = 240;
    const [startPoint, endPoint] = endpoints;
    const totalDuration = endPoint - startPoint;
    const segments = [];

    for (let offset = 0; offset < totalDuration; offset += segmentDuration) {
      const segmentStart = startPoint + offset;
      const segmentLength = Math.min(segmentDuration, totalDuration - offset);

      let segmentAudioPath = null;
      try {
        segmentAudioPath = await extractAudioSegment(
          tempVideoPath,
          segmentStart,
          segmentLength
        );
        tempFiles.push(segmentAudioPath);

        const audioBuffer = fs.readFileSync(segmentAudioPath);
        const form = new FormData();
        form.append("file", audioBuffer, {
          filename: `chunk_${segmentStart}.mp3`,
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

        const formattedSrt = formatSrtFile(whisperRes.data, segmentStart);
        segments.push(...formattedSrt);
      } catch (err) {
        console.error(`Error processing segment ${offset / 240 + 1}:`, err);
      } finally {
        if (segmentAudioPath && fs.existsSync(segmentAudioPath)) {
          fs.unlinkSync(segmentAudioPath);
        }
      }
    }

    if (tempVideoPath && fs.existsSync(tempVideoPath)) {
      fs.unlinkSync(tempVideoPath);
    }

    let translatedSegments;

    if (targetLanguage === sourceLanguage) {
      translatedSegments = segments;
    } else {
      translatedSegments = await translateSegments(segments, targetLanguage);
    }

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
          endpoints,
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
    return NextResponse.json(
      { message: "Check your Internet connection" },
      { status: 500 }
    );
  } finally {
    await session.endSession();
    for (const filePath of tempFiles) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }
}
