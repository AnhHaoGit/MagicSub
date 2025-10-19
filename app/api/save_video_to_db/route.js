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
    const body = await req.json();
    const { userId, cloudUrl, title, size, duration, createdAt, style } = body;

    if (!userId || !cloudUrl) {
      return NextResponse.json(
        { error: "Missing userId or cloudUrl" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const result = await db.collection("videos").insertOne({
      userId: new ObjectId(userId),
      cloudUrl,
      title,
      size,
      duration,
      createdAt,
      customize: style,
    });

    return NextResponse.json({
      _id: result.insertedId,
      userId,
      cloudUrl,
      title,
      size,
      duration,
      createdAt,
      customize: style,
    });
  } catch (err) {
    console.error("Error saving video:", err);
    return NextResponse.json(
      { error: "Failed to save video" },
      { status: 500 }
    );
  }
}
