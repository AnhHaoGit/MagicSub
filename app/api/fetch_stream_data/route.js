import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

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
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { videoId, subtitleId } = await req.json();

  try {
    const db = await connectDB();

    const video = await db
      .collection("videos")
      .findOne({ _id: new ObjectId(videoId) });

    const subtitle = await db
      .collection("subtitle")
      .findOne({ _id: new ObjectId(subtitleId) });

    return NextResponse.json({ video, subtitle: subtitle.subtitle });
  } catch (error) {
    console.error("Error fetching stream data:", error);
    return NextResponse.json(
      { error: "Failed to fetch stream data!" },
      { status: 500 }
    );
  }
}
