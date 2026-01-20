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

export async function POST(req) {
  try {
    const { videoId, mode } = await req.json();

    const db = await connectDB();
    const videos = db.collection("videos");

    await videos.updateOne(
      { _id: new ObjectId(videoId) },
      { $set: { mode } },
      { upsert: false }
    );

    return NextResponse.json(
      { ok: true, message: "Upload sharing mode updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
