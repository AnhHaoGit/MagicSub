import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

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
    const { userId, customize } = await req.json();

    if (!userId || !customize) {
      return NextResponse.json(
        { message: "Missing userId or customize" },
        { status: 400 }
      );
    }

    const db = await connectDB();

    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(userId) }, { $set: { style: customize } });

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { message: "User not found or style not updated" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Style updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating style:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
