import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

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
  const { videoPath } = await req.json();

  console.log(videoPath);

  if (!videoPath) {
    return NextResponse.json({ message: "Missing videoPath" }, { status: 400 });
  }

  const db = await connectDB();
  const video = await db.collection("videos").findOne({ _id: videoPath });

  if (!video) {
    return NextResponse.json({ message: "Video not found" }, { status: 404 });
  }

  return NextResponse.json({ cloudUrl: video.cloudUrl });
}
