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
    const { videoId, userId } = await req.json();

    const db = await connectDB();

    const result = await db.collection("videos").updateOne(
      { _id: new ObjectId(videoId) },
      {
        $pull: {
          allowedUsers: { _id: userId },
        },
      },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User removed successfully",
    });
  } catch (error) {
    console.error("Error removing user:", error);
    return NextResponse.json({ error: "Try again later!" }, { status: 500 });
  }
}
