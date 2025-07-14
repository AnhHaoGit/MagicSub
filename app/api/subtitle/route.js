import axios from "axios";
import fs from "fs";
import path from "path";
import { OpenAI } from "openai";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DB_NAME || "magicsub_db");
  }
  return db;
}

function parseSrt(srtText) {
  const segments = srtText.trim().split(/\n\s*\n/);
  return segments.map((segment) => {
    const lines = segment.split("\n");
    const [index, timeRange, ...textLines] = lines;
    return {
      index: parseInt(index),
      time: timeRange,
      text: textLines.join(" "),
    };
  });
}

function buildSrt(segments) {
  return segments
    .map(({ index, time, text }) => `${index}\n${time}\n${text.trim()}\n`)
    .join("\n");
}

export async function POST(req) {
  try {
    const { videoUrl, targetLanguage = "vi", videoId } = await req.json();

    if (!videoUrl || !videoId) {
      return new Response(
        JSON.stringify({ error: "Missing videoUrl or videoId" }),
        { status: 400 }
      );
    }

    // Step 1: Download video
    const response = await axios({
      method: "GET",
      url: videoUrl,
      responseType: "stream",
    });

    const tempVideoPath = path.join("/tmp", `${uuidv4()}.mp4`);
    const videoWriter = fs.createWriteStream(tempVideoPath);
    response.data.pipe(videoWriter);

    await new Promise((resolve, reject) => {
      videoWriter.on("finish", resolve);
      videoWriter.on("error", reject);
    });

    // Step 2: Extract audio to /public/audios (no quality loss)
    const audioFolder = path.join(process.cwd(), "public", "audios");
    if (!fs.existsSync(audioFolder)) {
      fs.mkdirSync(audioFolder, { recursive: true });
    }

    const audioFileName = `${uuidv4()}.m4a`;
    const savedAudioPath = path.join(audioFolder, audioFileName);

    await execPromise(
      `ffmpeg -i "${tempVideoPath}" -vn -acodec copy "${savedAudioPath}"`
    );

    // Step 3: Transcribe with OpenAI Whisper
    const transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(savedAudioPath),
      model: "whisper-1",
      response_format: "srt",
    });

    // Cleanup video
    fs.unlinkSync(tempVideoPath);
    // Keep audio for frontend preview

    const originalSrt = transcript;
    const segments = parseSrt(originalSrt);

    // Step 4: Translate subtitles using GPT
    const promptMessages = [
      {
        role: "system",
        content: `You are a professional translator. Translate the following subtitles into "${targetLanguage}". Keep the structure, numbering, and timestamps unchanged. Only translate the subtitle text.`,
      },
      {
        role: "user",
        content: buildSrt(segments),
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: promptMessages,
      temperature: 0.3,
    });

    const translatedSrt = completion.choices[0].message.content;

    // Step 5: Save to MongoDB
    const db = await connectDB();

    // Save original transcript in "videos" collection
    await db
      .collection("videos")
      .updateOne(
        { _id: videoId },
        { $set: { transcript: originalSrt } }
      );

    // Save translation in "translation" collection
    await db.collection("translation").insertOne({
      video_id: videoId,
      language: targetLanguage,
      translated_transcript: translatedSrt,
      createdAt: new Date(),
    });

    // Return audio URL so frontend can play
    const audioUrl = `/audios/${audioFileName}`;

    return NextResponse.json(
      { originalSrt, translatedSrt, audioUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to process and translate subtitle" },
      { status: 500 }
    );
  }
}
