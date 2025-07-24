"use server";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
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
    lastSecond: srtToSecondsTimestamp(formattedData[formattedData.length - 1].end),
  };
};

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { directUrl, _id, targetLanguage } = await req.json();
    if (!directUrl || !_id || !targetLanguage) {
      return NextResponse.json(
        { message: "Missing parameters" },
        { status: 400 }
      );
    }

    const response = await axios.get(directUrl, {
      responseType: "arraybuffer",
    });
    const audioBuffer = Buffer.from(response.data);

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "chunks-"));

    // Tách file bằng ffmpeg
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        "pipe:0",
        "-f",
        "segment",
        "-segment_time",
        "240",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        "-reset_timestamps",
        "1",
        path.join(tempDir, "chunk_%03d.mp3"),
      ]);

      ffmpeg.on("error", (err) => reject(err));
      ffmpeg.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });

      const readable = Readable.from(audioBuffer);
      readable.pipe(ffmpeg.stdin);
    });

    // Đọc các file nhỏ và gửi lên Whisper (định dạng srt)
    const files = await fs.readdir(tempDir);
    files.sort();
    const segments = [];
    let lastSecond = 0;

    for (const fileName of files) {
      const filePath = path.join(tempDir, fileName);
      const fileBuffer = await fs.readFile(filePath);

      const form = new FormData();
      form.append("file", fileBuffer, {
        filename: fileName,
        contentType: "audio/mp3",
      });
      form.append("model", "whisper-1");
      form.append("response_format", "srt"); // <-- chuyển về srt
      form.append("language", targetLanguage);

      const whisperRes = await axios.post(WHISPER_API_URL, form, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          ...form.getHeaders(),
        },
      });

      const formattedSrt = formatSrtFile(whisperRes.data, lastSecond);

      lastSecond = formattedSrt.lastSecond;
      const { formattedData } = formattedSrt;
      segments.push(...formattedData);
    }

    await fs.rm(tempDir, { recursive: true, force: true });

    const db = await connectDB();
    await db.collection("subtitle").insertOne({
      userId: new ObjectId(session.user.id),
      videoId: new ObjectId(_id),
      subtitle: segments,
    });

    return NextResponse.json({
      message: "Transcript segments saved (SRT format)",
      subtitle: segments,
    });
  } catch (err) {
    console.error("Error processing video:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
