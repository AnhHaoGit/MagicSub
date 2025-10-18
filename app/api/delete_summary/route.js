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
    const { summaryId } = await req.json();

    const db = await connectDB();
    const collection = db.collection("summary");

    const result = await collection.deleteOne({
      _id: new ObjectId(summaryId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Summary not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Summary deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete summary error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
