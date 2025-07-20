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
import { randomUUID } from "crypto";
import FormData from "form-data";

// Whisper API endpoint
const WHISPER_API_URL = "https://api.openai.com/v1/audio/transcriptions";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

    // Step 1: Download audio
    const response = await axios.get(directUrl, {
      responseType: "arraybuffer",
    });
    const audioBuffer = Buffer.from(response.data);

    // Step 2: Pipe audioBuffer into ffmpeg and collect chunks as buffers
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "chunks-"));
    const chunks = [];

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

      ffmpeg.stderr.on("data", (data) => {
        console.log("ffmpeg stderr:", data.toString());
      });

      ffmpeg.on("error", (err) => reject(err));
      ffmpeg.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });

      const readable = Readable.from(audioBuffer);
      readable.pipe(ffmpeg.stdin);
    });

    // Step 3: Read all chunk files and send to Whisper
    const files = await fs.readdir(tempDir);
    files.sort(); // Ensure chunks are in order
    let fullText = "";

    for (const fileName of files) {
      const filePath = path.join(tempDir, fileName);
      const fileBuffer = await fs.readFile(filePath);

      const form = new FormData();
      form.append("file", fileBuffer, {
        filename: fileName,
        contentType: "audio/mp3",
      });
      form.append("model", "whisper-1");
      form.append("response_format", "text");
      form.append("language", targetLanguage); // optional

      const whisperRes = await axios.post(WHISPER_API_URL, form, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          ...form.getHeaders(),
        },
      });

      fullText += whisperRes.data + "\n";
    }

    // Clean up temp files
    await fs.rm(tempDir, { recursive: true, force: true });

    // Return final result
    return NextResponse.json({
      message: "Transcript generated",
      text: fullText.trim(),
    });
  } catch (err) {
    console.error("Error processing audio:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
