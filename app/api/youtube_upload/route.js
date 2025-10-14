import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { MongoClient, ObjectId } from "mongodb";
import { spawn } from "child_process";
import axios from "axios";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DB_NAME || "magicsub_db");
  }
  return db;
}

async function downloadYouTubeVideo(url) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn("yt-dlp", [
      "-f",
      "bestvideo[height<=720]+bestaudio/best[height<=720]",
      "-o",
      "-",
      "--merge-output-format",
      "mp4",
      url,
    ]);

    const chunks = [];
    ytdlp.stdout.on("data", (chunk) => chunks.push(chunk));
    ytdlp.stderr.on("data", (data) => console.log("yt-dlp:", data.toString()));

    ytdlp.on("error", reject);
    ytdlp.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { youtubeUrl, userId, createdAt, style } = body;

    if (!youtubeUrl || !userId) {
      return NextResponse.json(
        { error: "Missing youtubeUrl or userId" },
        { status: 400 }
      );
    }

    console.log("Downloading video from YouTube:", youtubeUrl);
    const videoBuffer = await downloadYouTubeVideo(youtubeUrl);

    const size = videoBuffer.length;
    const key = `uploads/youtube_${Date.now()}.mp4`;

    console.log("Uploading to AWS S3...");

    // upload lên S3
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: videoBuffer,
      ContentType: "video/mp4",
    });

    await s3.send(uploadCommand);

    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // lấy metadata duration (tùy chọn)
    let duration = null;
    try {
      const infoRes = await axios.get(
        `https://noembed.com/embed?url=${encodeURIComponent(youtubeUrl)}`
      );
      duration = infoRes.data?.duration || null;
    } catch {
      console.log("Cannot fetch duration info from noembed");
    }

    const db = await connectDB();
    const result = await db.collection("videos").insertOne({
      userId: new ObjectId(userId),
      cloudUrl: fileUrl,
      youtubeUrl,
      size,
      duration,
      createdAt: createdAt || new Date(),
      customize: style,
    });

    return NextResponse.json({
      _id: result.insertedId,
      userId,
      cloudUrl: fileUrl,
      youtubeUrl,
      size,
      duration,
      createdAt,
      customize: style,
      message: "Video uploaded to AWS successfully.",
    });
  } catch (err) {
    console.error("Error uploading YouTube video:", err);
    return NextResponse.json(
      { error: "Failed to process YouTube video" },
      { status: 500 }
    );
  }
}
