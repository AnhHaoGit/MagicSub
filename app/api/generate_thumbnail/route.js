import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
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

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DB_NAME || "magicsub_db");
  }
  return db;
}

async function generateThumbnail(videoUrl) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "thumb-"));
  const thumbPath = path.join(tempDir, `${uuidv4()}.jpg`);

  return new Promise((resolve, reject) => {
    ffmpeg(videoUrl)
      .on("end", () => resolve(thumbPath))
      .on("error", (err) => reject(err))
      .screenshots({
        timestamps: ["5%"],
        filename: path.basename(thumbPath),
        folder: tempDir,
        size: "320x?",
      });
  });
}

export async function POST(req) {
  try {
    const { videoId, cloudUrl } = await req.json();
    if (!videoId || !cloudUrl) {
      return NextResponse.json(
        { error: "Missing videoId or cloudUrl" },
        { status: 400 }
      );
    }

    // Generate thumbnail
    const thumbPath = await generateThumbnail(cloudUrl);
    const thumbKey = `thumbnails/${Date.now()}_${path.basename(thumbPath)}`;
    const fileBuffer = await fs.readFile(thumbPath);

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: thumbKey,
        Body: fileBuffer,
        ContentType: "image/jpeg",
      })
    );

    const thumbnailUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbKey}`;

    // Update DB
    const db = await connectDB();
    await db
      .collection("videos")
      .updateOne({ _id: new ObjectId(videoId) }, { $set: { thumbnailUrl } });

    return NextResponse.json({ thumbnailUrl });
  } catch (err) {
    console.error("❌ Thumbnail generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate thumbnail" },
      { status: 500 }
    );
  }
}
