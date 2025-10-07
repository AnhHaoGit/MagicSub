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

async function summarizeTranscript(segments) {
  const systemPrompt = `
You are an expert video summarizer.
Summarize the following transcript (with timestamps) into clear, structured sections suitable for displaying on a website.

Each point must include an approximate timestamp (in seconds) showing where that idea appears in the video.

Return valid JSON only, matching exactly this structure:
{
  "title": "Overall title of the summary",
  "sections": [
    {
      "heading": "Section heading (e.g., Introduction, Main Ideas, Key Takeaways...)",
      "points": [
        {
          "text": "Short summary of idea",
          "timestamp": 123
        }
      ]
    }
  ],
  "conclusion": "1–3 sentences summarizing the whole video."
}

Rules:
- Always output valid JSON (no markdown or explanations).
- The number of sections: 3–6.
- Each section must have 2–6 concise bullet points.
- Each timestamp must be an integer representing seconds.
- Base timestamps on the approximate timing of relevant content.
- Write in a clear, engaging style suitable for general users.
`;

  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(segments) },
      ],
      temperature: 0.4,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  let jsonData;
  try {
    jsonData = JSON.parse(res.data.choices[0].message.content.trim());
  } catch (err) {
    console.error("Error parsing JSON summary:", err);
    throw new Error("Failed to parse structured summary from model.");
  }

  return jsonData;
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

    const segmentDuration = 240; // 4 phút/segment
    const totalDuration = duration;
    let segmentsAll = [];

    // chia nhỏ audio và gửi Whisper
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
      form.append("response_format", "verbose_json");

      const whisperRes = await axios.post(WHISPER_API_URL, form, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          ...form.getHeaders(),
        },
      });

      const parsed =
        typeof whisperRes.data === "string"
          ? JSON.parse(whisperRes.data)
          : whisperRes.data;

      if (parsed.segments && Array.isArray(parsed.segments)) {
        parsed.segments.forEach((seg) => {
          segmentsAll.push({
            start: seg.start + start,
            end: seg.end + start,
            text: seg.text.trim(),
          });
        });
      }
    }

    console.log("Total segments:", segmentsAll.length);

    // tóm tắt bằng GPT có timestamp
    const summaryText = await summarizeTranscript(segmentsAll);

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
