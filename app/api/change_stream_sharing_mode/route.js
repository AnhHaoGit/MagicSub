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
    const { subtitleId, locked } = await req.json();

    const db = await connectDB();
    const subtitle = db.collection("subtitle");

    await subtitle.updateOne(
      { _id: new ObjectId(subtitleId) },
      { $set: { locked } },
      { upsert: false }
    );

    return NextResponse.json(
      { ok: true, message: "Source updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
