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
    const { subtitleId } = await req.json();

    const db = await connectDB();
    const collection = db.collection("subtitle");

    const result = await collection.deleteOne({
      _id: new ObjectId(subtitleId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Subtitle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Subtitle deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete subtitle error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
