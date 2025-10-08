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

async function summarizeTranscript(segments, option) {
  let styleInstruction = "";

  switch (option) {
    case "short_summary":
      styleInstruction = `
Create a concise summary (around 3–5 key sections total) that captures only the main ideas of the video.
Keep sentences short and easy to skim.`;
      break;
    case "detailed_summary":
      styleInstruction = `
Create a detailed, in-depth summary (5–7 sections) explaining the flow of ideas, arguments, or narrative.
Include more context and clear timestamps to guide the reader.`;
      break;
    case "cheat_sheet":
      styleInstruction = `
Create a "Cheat Sheet" style summary.
Focus on key points, actionable insights, and practical takeaways.
Use short bullet points (phrases or sentences).
Output still must follow the required JSON structure, but each point should be concise and list-like.`;
      break;
    default:
      styleInstruction = "Write a balanced structured summary.";
  }

  const systemPrompt = `
You are an expert video summarizer.
Your task is to summarize a video transcript into a structured, timestamped format.
${styleInstruction}

Always return **valid JSON** only, with this exact structure:
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
- Output must be parseable JSON only (no markdown, no extra text).
- 3–6 sections total.
- Each section must have 2–6 points.
- Each timestamp must be an integer (seconds).
- Base timestamps on the relevant content timing.
- Write naturally and clearly for general readers.
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
    const { cloudUrl, _id, userId, duration, cost, option } = await req.json();

    if (!cloudUrl || !_id || !userId || !duration || !cost || !option) {
      return NextResponse.json(
        { message: "Missing parameters" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const users = db.collection("users");
    const videos = db.collection("videos");
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

    const videoDoc = await videos.findOne({ _id: new ObjectId(_id) });
    let segmentsAll = [];

    if (videoDoc && videoDoc.transcript && videoDoc.transcript.length > 0) {
      console.log("Using existing transcript from DB");
      segmentsAll = videoDoc.transcript;
    } else {
      console.log("No transcript found, generating new...");

      const response = await axios.get(cloudUrl, {
        responseType: "arraybuffer",
      });
      const audioBuffer = Buffer.from(response.data);

      const segmentDuration = 240;
      const totalDuration = duration;

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

      await videos.updateOne(
        { _id: new ObjectId(_id) },
        { $set: { transcript: segmentsAll } }
      );
      console.log("Transcript saved to DB");
    }

    const summaryText = await summarizeTranscript(segmentsAll, option);

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
          option: option,
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
