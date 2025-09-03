"use server";

import { NextResponse } from "next/server";
import axios from "axios";
import { Readable } from "stream";
import { spawn } from "child_process";
import path from "path";
import os from "os";
import fs from "fs/promises";
import FormData from "form-data";
import { MongoClient, ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { srtToSecondsTimestamp } from "@/lib/srt_to_second";
import { secondsToSrtTimestamp } from "@/lib/second_to_srt";

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
      "-i", "pipe:0",
      "-ss", start.toString(),
      "-t", duration.toString(),
      "-f", "mp3",
      "-acodec", "libmp3lame",
      "pipe:1"
    ]);
    const chunks = [];
    ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on("data", (d) => console.log("ffmpeg err:", d.toString()));
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
    Readable.from(buffer).pipe(ffmpeg.stdin);
  });
}

export async function POST(req) {
  try {
    const { cloudUrl, _id, targetLanguage, style, userId, duration } = await req.json();

    if (!cloudUrl || !_id || !targetLanguage || !userId || !duration) {
      return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
    }

    const response = await axios.get(cloudUrl, { responseType: "arraybuffer" });
    const audioBuffer = Buffer.from(response.data);

    // Giả sử video dài 5 phút, chia thành các đoạn 240s
    const segmentDuration = 240;
    const totalDuration = duration; // hoặc lấy từ metadata video/audio
    const segments = [];
    let lastSecond = 0;

    for (let start = 0; start < totalDuration; start += segmentDuration) {
      const segmentBuffer = await extractAudioSegment(audioBuffer, start, segmentDuration);

      const form = new FormData();
      form.append("file", segmentBuffer, {
        filename: `chunk_${start}.mp3`,
        contentType: "audio/mp3",
      });
      form.append("model", "whisper-1");
      form.append("response_format", "srt");
      form.append("language", targetLanguage);

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

    const db = await connectDB();
    const result = await db.collection("subtitle").insertOne({
      userId: new ObjectId(userId),
      videoId: new ObjectId(_id),
      subtitle: segments,
      customize: style,
    });

    return NextResponse.json({
      message: "Transcript segments saved (SRT format)",
      subtitle: segments,
      subtitleId: result.insertedId,
      customize: style,
    });
  } catch (err) {
    console.error("Error processing video:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}














// export async function POST(req) {
//   try {
//     const { cloudUrl, _id, targetLanguage, style, userId } = await req.json();

//     if (!cloudUrl || !_id || !targetLanguage || !userId) {
//       console.warn("⚠️ Thiếu parameters!");
//       return NextResponse.json(
//         { message: "Missing parameters" },
//         { status: 400 }
//       );
//     }

//     const response = await axios.get(cloudUrl, { responseType: "arraybuffer" });
//     const audioBuffer = Buffer.from(response.data);
//     const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "chunks-"));

//     // Tách file bằng ffmpeg
//     console.log("🎬 Bắt đầu tách file bằng ffmpeg...");
//     await new Promise((resolve, reject) => {
//       const ffmpeg = spawn("ffmpeg", [
//         "-i",
//         "pipe:0",
//         "-f",
//         "segment",
//         "-segment_time",
//         "240",
//         "-c:a",
//         "libmp3lame",
//         "-b:a",
//         "192k",
//         "-reset_timestamps",
//         "1",
//         path.join(tempDir, "chunk_%03d.mp3"),
//       ]);

//       ffmpeg.stdout?.on("data", (d) =>
//         console.log("ffmpeg out:", d.toString())
//       );
//       ffmpeg.stderr?.on("data", (d) =>
//         console.log("ffmpeg err:", d.toString())
//       );

//       ffmpeg.on("error", (err) => reject(err));
//       ffmpeg.on("close", (code) => {
//         console.log("ffmpeg closed with code:", code);
//         if (code === 0) resolve();
//         else reject(new Error(`ffmpeg exited with code ${code}`));
//       });

//       Readable.from(audioBuffer).pipe(ffmpeg.stdin);
//     });

//     const files = await fs.readdir(tempDir);
//     files.sort();

//     const segments = [];
//     let lastSecond = 0;

//     for (const fileName of files) {
//       const filePath = path.join(tempDir, fileName);
//       const fileBuffer = await fs.readFile(filePath);

//       const form = new FormData();
//       form.append("file", fileBuffer, {
//         filename: fileName,
//         contentType: "audio/mp3",
//       });
//       form.append("model", "whisper-1");
//       form.append("response_format", "srt");
//       form.append("language", targetLanguage);

//       const whisperRes = await axios.post(WHISPER_API_URL, form, {
//         headers: {
//           Authorization: `Bearer ${OPENAI_API_KEY}`,
//           ...form.getHeaders(),
//         },
//       });

//       const formattedSrt = formatSrtFile(whisperRes.data, lastSecond);
//       lastSecond = formattedSrt.lastSecond;
//       segments.push(...formattedSrt.formattedData);
//     }

//     await fs.rm(tempDir, { recursive: true, force: true });

//     const db = await connectDB();
//     const result = await db.collection("subtitle").insertOne({
//       userId: new ObjectId(userId),
//       videoId: new ObjectId(_id),
//       subtitle: segments,
//       customize: style,
//     });

//     return NextResponse.json({
//       message: "Transcript segments saved (SRT format)",
//       subtitle: segments,
//       subtitleId: result.insertedId,
//       customize: style,
//     });
//   } catch (err) {
//     console.error("Error processing video:", err);
//     return NextResponse.json({ message: "Server error" }, { status: 500 });
//   }
// }
