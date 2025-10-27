"use server";

import { NextResponse } from "next/server";
import axios from "axios";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { connectDB } from "@/lib/connect_db";
import { formatLanguage } from "@/lib/format_language";
import { formatSrtFile } from "@/lib/format_srt_file";

const WHISPER_API_URL = "https://api.openai.com/v1/audio/transcriptions";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function sliceAudioBuffer(buffer, start, duration) {
  const inputPath = path.join("/tmp", `input_${uuidv4()}.mp3`);
  const outputPath = path.join("/tmp", `segment_${start}_${uuidv4()}.mp3`);
  fs.writeFileSync(inputPath, buffer);

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-ss",
      start.toString(),
      "-t",
      duration.toString(),
      "-i",
      inputPath,
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
      outputPath,
    ]);

    ffmpeg.stderr.on("data", (d) => console.log("ffmpeg:", d.toString()));
    ffmpeg.on("error", (err) => {
      fs.unlinkSync(inputPath);
      reject(err);
    });
    ffmpeg.on("close", (code) => {
      fs.unlinkSync(inputPath);
      if (code === 0) resolve(outputPath);
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
    } catch {
      throw new Error("Failed to parse translation response");
    }

    if (translatedArray.length !== batch.length) {
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
  const client = await connectDB();
  const session = client.client.startSession();
  const tempFiles = [];

  try {
    const {
      audioUrl,
      _id,
      sourceLanguage,
      targetLanguage,
      userId,
      cost,
      endpoints,
    } = await req.json();

    const db = client;
    const users = db.collection("users");
    const subtitles = db.collection("subtitle");

    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user)
      return NextResponse.json({ message: "User not found!" }, { status: 404 });
    if ((user.gems || 0) < cost)
      return NextResponse.json(
        { message: "Not enough gems to process request!" },
        { status: 400 }
      );

    const audioResponse = await axios.get(audioUrl, {
      responseType: "arraybuffer",
    });
    const audioBuffer = Buffer.from(audioResponse.data);

    const segmentDuration = 240;
    const [startPoint, endPoint] = endpoints;
    const totalDuration = endPoint - startPoint;
    const segments = [];

    for (let offset = 0; offset < totalDuration; offset += segmentDuration) {
      const segmentStart = startPoint + offset;
      const segmentLength = Math.min(segmentDuration, totalDuration - offset);

      let segmentAudioPath = null;
      try {
        segmentAudioPath = await sliceAudioBuffer(
          audioBuffer,
          segmentStart,
          segmentLength
        );

        tempFiles.push(segmentAudioPath);

        const chunkBuffer = fs.readFileSync(segmentAudioPath);
        const form = new FormData();
        form.append("file", chunkBuffer, {
          filename: `chunk_${segmentStart}.mp3`,
          contentType: "audio/mp3",
        });
        form.append("model", "whisper-1");
        form.append("response_format", "srt");
        if (sourceLanguage !== "auto") form.append("language", sourceLanguage);

        const whisperRes = await axios.post(WHISPER_API_URL, form, {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            ...form.getHeaders(),
          },
        });

        const formattedSrt = formatSrtFile(whisperRes.data, segmentStart);
        segments.push(...formattedSrt);
      } catch {
        return NextResponse.json(
          { message: `Error processing segment ${offset / 240 + 1}` },
          { status: 500 }
        );
      } finally {
        if (segmentAudioPath && fs.existsSync(segmentAudioPath))
          fs.unlinkSync(segmentAudioPath);
      }
    }

    const translatedSegments =
      targetLanguage === sourceLanguage
        ? segments
        : await translateSegments(segments, targetLanguage);

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
  } catch {
    return NextResponse.json(
      { message: "Check your Internet connection. Try again later." },
      { status: 500 }
    );
  } finally {
    await session.endSession();
    for (const filePath of tempFiles) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }
}
