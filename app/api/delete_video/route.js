import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DB_NAME || "magicsub_db");
  }
  return db;
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "magicsub-storage";

export async function DELETE(req) {
  try {
    const { userId, videoId } = await req.json();

    if (!userId || !videoId) {
      return NextResponse.json(
        { message: "Missing userId or videoId" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const videosCol = db.collection("videos");
    const subtitlesCol = db.collection("subtitle");
    const summariesCol = db.collection("summary");

    const video = await videosCol.findOne({
      _id: new ObjectId(videoId),
      userId: new ObjectId(userId),
    });

    if (!video) {
      return NextResponse.json(
        { message: "Video not found or not owned by user" },
        { status: 404 }
      );
    }

    const keysToDelete = [];

    if (video.uploadKey) keysToDelete.push({ Key: video.uploadKey });
    if (video.audioKey) keysToDelete.push({ Key: video.audioKey });
    if (video.thumbnailKey) keysToDelete.push({ Key: video.thumbnailKey });
    if (Array.isArray(video.cloudUrls)) {
      video.cloudUrls.forEach((item) => {
        if (item.key) keysToDelete.push({ Key: item.key });
      });
    }

    if (keysToDelete.length > 0) {
      try {
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: BUCKET_NAME,
            Delete: { Objects: keysToDelete },
          })
        );
      } catch (s3Error) {
        console.error("Failed to delete from S3:", s3Error);
      }
    }

    await Promise.all([
      videosCol.deleteOne({
        _id: new ObjectId(videoId),
        userId: new ObjectId(userId),
      }),
      subtitlesCol.deleteMany({
        videoId: new ObjectId(videoId),
        userId: new ObjectId(userId),
      }),
      summariesCol.deleteMany({
        videoId: new ObjectId(videoId),
        userId: new ObjectId(userId),
      }),
    ]);

    return NextResponse.json(
      { message: "Video and related data deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete video error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
