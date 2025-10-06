"use server";

import { NextResponse } from "next/server";
import axios from "axios";
import { Readable } from "stream";
import { spawn } from "child_process";
import FormData from "form-data";
import { MongoClient, ObjectId } from "mongodb";

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

async function summarizeTranscript(transcript) {
  const systemPrompt = `You are an expert video summarizer. Summarize the following transcript into a clear, coherent paragraph capturing the key points and overall meaning. Focus on main ideas, not line-by-line details. Output only the summary text.`;

  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcript },
      ],
      temperature: 0.5,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data.choices[0].message.content.trim();
}

export async function POST(req) {
  const session = client.startSession();

  try {
    const { cloudUrl, _id, userId, duration, cost } = await req.json();

    if (!cloudUrl || !_id || !userId || !duration || !cost) {
      return NextResponse.json(
        { message: "Missing parameters" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const users = db.collection("users");
    const summaries = db.collection("summary");

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

    // tải video từ cloud
    const response = await axios.get(cloudUrl, { responseType: "arraybuffer" });
    const audioBuffer = Buffer.from(response.data);

    const segmentDuration = 240;
    const totalDuration = duration;
    let transcriptFull = "";

    // chia nhỏ audio để gửi Whisper
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
      form.append("response_format", "text");

      const whisperRes = await axios.post(WHISPER_API_URL, form, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          ...form.getHeaders(),
        },
      });

      transcriptFull += whisperRes.data + "\n";
    }

    const summaryText = await summarizeTranscript(transcriptFull);

    let result;
    await session.withTransaction(async () => {
      await users.updateOne(
        { _id: new ObjectId(userId) },
        { $inc: { gems: -cost } },
        { session }
      );

      result = await summaries.insertOne(
        {
          userId: new ObjectId(userId),
          videoId: new ObjectId(_id),
          summary: summaryText,
          createdAt: new Date(),
        },
        { session }
      );
    });

    return NextResponse.json({
      message: "Summary created successfully",
      summaryId: result.insertedId,
      summary: summaryText,
    });
  } catch (err) {
    console.error("Error processing video summary:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  } finally {
    await session.endSession();
  }
}
