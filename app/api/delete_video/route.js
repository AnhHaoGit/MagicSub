import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
let db;

// Kết nối đến database
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
    const collection = db.collection("videos");

    // Xoá video khớp cả userId và _id
    const result = await collection.deleteOne({
      _id: new ObjectId(videoId),
      userId: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Video not found or not owned by user" },
        { status: 404 }
      );
    }

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