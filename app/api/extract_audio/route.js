import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import https from "https";
import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(req) {
  let tempVideoPath = null;
  let tempAudioPath = null;

  try {
    const { fileUrl } = await req.json();
    if (!fileUrl) {
      return NextResponse.json({ error: "Missing fileUrl" }, { status: 400 });
    }

    tempVideoPath = path.join(os.tmpdir(), `video_${Date.now()}.mp4`);
    tempAudioPath = path.join(os.tmpdir(), `audio_${Date.now()}.mp3`);

    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tempVideoPath);
      https
        .get(fileUrl, (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`Download failed with status ${res.statusCode}`));
            return;
          }
          res.pipe(file);
          file.on("finish", () => file.close(resolve));
        })
        .on("error", (err) => {
          fs.unlink(tempVideoPath, () => reject(err));
        });
    });

    await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        tempVideoPath,
        "-vn",
        "-acodec",
        "libmp3lame",
        "-b:a",
        "192k",
        "-f",
        "mp3",
        tempAudioPath,
      ]);

      ffmpeg.stderr.on("data", (data) =>
        console.log("FFmpeg log:", data.toString())
      );

      ffmpeg.on("error", (err) => {
        console.error("FFmpeg spawn error:", err);
        reject(err);
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error("FFmpeg failed to extract audio"));
      });
    });

    const audioBuffer = fs.readFileSync(tempAudioPath);
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
  } finally {
    try {
      if (tempVideoPath && fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
      }
      if (tempAudioPath && fs.existsSync(tempAudioPath)) {
        fs.unlinkSync(tempAudioPath);
      }
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr.message);
    }
  }
}
