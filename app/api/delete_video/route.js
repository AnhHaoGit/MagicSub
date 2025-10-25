import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DB_NAME || "magicsub_db");
  }
  return db;
}

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

    // Xoá video
    const videoResult = await videosCol.deleteOne({
      _id: new ObjectId(videoId),
      userId: new ObjectId(userId),
    });

    if (videoResult.deletedCount === 0) {
      return NextResponse.json(
        { message: "Video not found or not owned by user" },
        { status: 404 }
      );
    }

    await Promise.all([
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
      { message: "Video deleted successfully" },
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
