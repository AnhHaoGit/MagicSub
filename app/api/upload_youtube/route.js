import { NextResponse } from "next/server";
import { spawn, execSync } from "child_process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function getVideoMetadata(youtubeUrl) {
  try {
    const output = execSync(`yt-dlp -j ${youtubeUrl}`, { encoding: "utf8" });
    const info = JSON.parse(output);

    return {
      title: info.title || "Untitled",
      duration: info.duration || 0,
      filesize: info.filesize || info.filesize_approx || null,
    };
  } catch (err) {
    console.warn("⚠️ Failed to get video metadata:", err.message);
    return { title: "Unknown", duration: 0, filesize: null };
  }
}

async function downloadYouTubeVideo(youtubeUrl, tempFilePath) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn("yt-dlp", [
      youtubeUrl,
      "-S",
      "res,ext:mp4:m4a",
      "--recode-video",
      "mp4",
      "-o",
      tempFilePath,
    ]);

    ytdlp.stderr.on("data", (data) => console.log("yt-dlp:", data.toString()));
    ytdlp.on("error", (err) => reject(err));
    ytdlp.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp exited with code ${code}`));
    });
  });
}

async function extractAudioFromVideo(videoPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      videoPath,
      "-vn",
      "-acodec",
      "libmp3lame",
      "-b:a",
      "192k",
      "-f",
      "mp3",
      outputPath,
    ]);

    ffmpeg.stderr.on("data", (data) =>
      console.log("FFmpeg log:", data.toString())
    );
    ffmpeg.on("error", (err) => reject(err));
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });
}

export async function POST(req) {
  let tempVideoPath = null;
  let tempAudioPath = null;

  try {
    const { youtubeUrl } = await req.json();
    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "Missing youtubeUrl" },
        { status: 400 }
      );
    }

    const metadata = await getVideoMetadata(youtubeUrl);

    tempVideoPath = path.join(os.tmpdir(), `video_${uuidv4()}.mp4`);
    await downloadYouTubeVideo(youtubeUrl, tempVideoPath);

    const uploadKey = `uploads/${uuidv4()}`;
    const videoBuffer = fs.readFileSync(tempVideoPath);
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: uploadKey,
        Body: videoBuffer,
        ContentType: "video/mp4",
      })
    );

    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadKey}`;

    tempAudioPath = path.join(os.tmpdir(), `audio_${uuidv4()}.mp3`);
    await extractAudioFromVideo(tempVideoPath, tempAudioPath);

    const audioBuffer = fs.readFileSync(tempAudioPath);
    const audioKey = `audios/${uuidv4()}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: audioKey,
        Body: audioBuffer,
        ContentType: "audio/mpeg",
      })
    );

    const audioUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${audioKey}`;

    return NextResponse.json({
      fileUrl,
      uploadKey,
      audioUrl,
      audioKey,
      title: metadata.title,
      duration: metadata.duration,
      size: metadata.filesize,
    });
  } catch (error) {
    console.error("Error processing video:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload video" },
      { status: 500 }
    );
  } finally {
    try {
      if (tempVideoPath && fs.existsSync(tempVideoPath))
        fs.unlinkSync(tempVideoPath);
      if (tempAudioPath && fs.existsSync(tempAudioPath))
        fs.unlinkSync(tempAudioPath);
    } catch (cleanupErr) {
      console.error("Cleanup error:", cleanupErr);
    }
  }
}
