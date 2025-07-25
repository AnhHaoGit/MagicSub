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

export async function PUT(req) {
  try {
    const { subtitleId, subtitle } = await req.json();

    if (!subtitleId || !subtitle) {
      return NextResponse.json(
        { message: "Missing parameters" },
        { status: 400 }
      );
    }

    if (!Array.isArray(subtitle)) {
      return NextResponse.json(
        { message: "Invalid subtitle data." },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const collection = db.collection("subtitle");

    await collection.updateOne(
      { _id: new ObjectId(subtitleId) },
      { $set: { subtitle: subtitle } },
      { upsert: true } // If not exist, create new
    );

    return NextResponse.json(
      { message: "Subtitle updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
