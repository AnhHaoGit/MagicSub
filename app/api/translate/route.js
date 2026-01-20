"use server";

import { NextResponse } from "next/server";
import axios from "axios";
import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/connect_db";
import { formatLanguage } from "@/lib/format_language";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

  try {
    const { _id, targetLanguage, userId, cost, transcript } = await req.json();

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

    const translatedSegments = await translateSegments(
      transcript,
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
          locked: true,
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
  }
}
