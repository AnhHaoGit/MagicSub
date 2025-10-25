import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import https from "https";
import { spawn } from "child_process";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(req) {
  try {
    const { fileUrl } = await req.json();
    if (!fileUrl) {
      return NextResponse.json({ error: "Missing fileUrl" }, { status: 400 });
    }

    const videoBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      https.get(fileUrl, (res) => {
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
        res.on("error", reject);
      });
    });

    const audioBuffer = await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        "pipe:0",
        "-vn",
        "-acodec",
        "libmp3lame",
        "-b:a",
        "192k",
        "-f",
        "mp3",
        "pipe:1",
      ]);

      const chunks = [];

      ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
      ffmpeg.stderr.on("data", (data) =>
        console.log("FFmpeg log:", data.toString())
      );
      ffmpeg.on("error", (err) => {
        console.error("FFmpeg spawn error:", err);
        reject(err);
      });
      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error("FFmpeg failed to extract audio"));
        }
      });

      ffmpeg.stdin.write(videoBuffer);
      ffmpeg.stdin.end();
    });

    const audioKey = `audio/${Date.now()}`;
    const uploadAudio = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: audioKey,
      Body: audioBuffer,
      ContentType: "audio/mpeg",
    });

    await s3.send(uploadAudio);

    const audioUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${audioKey}`;

    return NextResponse.json({ audioUrl });
  } catch (err) {
    console.error("Error extracting audio:", err);
    return NextResponse.json(
      { error: "Failed to extract audio" },
      { status: 500 }
    );
  }
}
