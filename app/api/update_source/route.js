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
    const { userId, source } = await req.json();

    if (!userId || !source) {
      return NextResponse.json(
        { message: "Missing parameters" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const users = db.collection("users");

    await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { source } },
      { upsert: false }
    );

    return NextResponse.json(
      { message: "Source updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
