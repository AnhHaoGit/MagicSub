"use server";

import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const execPromise = util.promisify(exec);

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DB_NAME || "magicsub_db");
  }
  return db;
}

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ message: "Missing URL" }, { status: 400 });
    }

    const outputDir = path.join(process.cwd(), "downloads");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    // Download video using yt-dlp
    const command = `yt-dlp -o "${outputDir}/yt_video.%(ext)s" --print-json "${url}"`;
    const { stdout } = await execPromise(command);
    const videoInfo = JSON.parse(stdout.split("\n")[0]);

    const downloadedPath = path.join(outputDir, `yt_video.${videoInfo.ext}`);
    const convertedPath = path.join(outputDir, `converted_${Date.now()}.mp4`);

    // Convert video to MP4 using ffmpeg
    const ffmpegCommand = `ffmpeg -i "${downloadedPath}" -c:v libx264 -c:a aac -strict experimental "${convertedPath}"`;
    await execPromise(ffmpegCommand);

    // Upload to S3
    const s3Key = `youtube_uploads/yt_${Date.now()}.mp4`;
    const fileStream = fs.createReadStream(convertedPath);

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: fileStream,
        ContentType: "video/mp4",
      })
    );

    // Cleanup temp files
    fs.unlinkSync(downloadedPath);
    fs.unlinkSync(convertedPath);

    // Save to MongoDB
    const cloudUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    const videoData = {
      _id: s3Key.split("/")[1],
      user_id: new ObjectId(session.user.id),
      title: videoInfo.title,
      cloudUrl,
      duration: videoInfo.duration,
      originalUrl: url,
      createdAt: new Date(),
    };

    const db = await connectDB();
    await db.collection("videos").insertOne(videoData);

    return NextResponse.json({
      message: "Uploaded successfully",
      video: {
        _id: videoData._id,
        user_id: videoData.user_id,
        title: videoData.title,
        cloudUrl: videoData.cloudUrl,
        duration: videoData.duration,
        originalUrl: videoData.originalUrl,
        createdAt: videoData.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Upload or save failed:", error);
    return NextResponse.json(
      { message: "Upload or save failed" },
      { status: 500 }
    );
  }
}
