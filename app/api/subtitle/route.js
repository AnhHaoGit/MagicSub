import axios from "axios";
import fs from "fs";
import path from "path";
import { OpenAI } from "openai";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// Parse SRT into segments
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

// Build new SRT from processed segments
function buildSrt(segments) {
  return segments
    .map(({ index, time, text }) => `${index}\n${time}\n${text.trim()}\n`)
    .join("\n");
}

export async function POST(req) {
  try {
    const { videoUrl, targetLanguage = "vi" } = await req.json();

    if (!videoUrl) {
      return new Response(JSON.stringify({ error: "Missing videoUrl" }), {
        status: 400,
      });
    }

    // Step 1: Download video
    const response = await axios({
      method: "GET",
      url: videoUrl,
      responseType: "stream",
    });

    const tempPath = path.join("/tmp", `${uuidv4()}.mp4`);
    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Step 2: Transcribe to SRT
    const transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: "whisper-1",
      response_format: "srt",
    });

    fs.unlinkSync(tempPath);

    const originalSrt = transcript;
    const segments = parseSrt(originalSrt);

    // Step 3: Translate subtitles using GPT
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

    return NextResponse.json(
      {
        originalSrt,
        translatedSrt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process and translate subtitle" },
      { status: 500 }
    );
  }
}
