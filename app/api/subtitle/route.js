"use server";

import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import axios from "axios";
import { Readable } from "stream";
import { OpenAI } from "openai";

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

function bufferToReadable(buffer) {
  return Readable.from(buffer);
}

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

    // 1. Tải audio file (đúng định dạng Whisper hỗ trợ)
    const audioRes = await axios.get(directUrl, {
      responseType: "arraybuffer",
    });
    const audioBuffer = Buffer.from(audioRes.data);

    // 2. Gửi audio lên OpenAI Whisper để lấy transcript
    const transcriptRes = await openai.audio.transcriptions.create({
      file: bufferToReadable(audioBuffer),
      model: "whisper-1",
      response_format: "text",
    });
    const originalScript = transcriptRes;

    // 3. Dịch sang targetLanguage bằng GPT-4
    const translationRes = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following transcript into ${targetLanguage}, keeping the meaning accurate and natural.`,
        },
        {
          role: "user",
          content: originalScript,
        },
      ],
      temperature: 0.5,
    });

    const translatedScript = translationRes.choices[0].message.content;

    // 4. Lưu bản gốc vào videos
    const db = await connectDB();
    await db
      .collection("videos")
      .updateOne(
        { _id: new ObjectId(_id) },
        { $set: { originalScript: originalScript } }
      );

    // 5. Lưu bản dịch vào collection translation
    const result = await db.collection("translation").insertOne({
      videoId: new ObjectId(_id),
      userId: new ObjectId(session.user.id),
      translatedScript,
      language: targetLanguage,
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: "Transcript created and translated successfully",
      translationId: result.insertedId,
    });
  } catch (error) {
    console.error("Transcript or translation failed:", error);
    return NextResponse.json(
      { message: "Transcript or translation failed" },
      { status: 500 }
    );
  }
}
