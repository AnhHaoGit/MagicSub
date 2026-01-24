import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
    const { videoId } = await req.json();
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const db = await connectDB();

    const videoData = await db
      .collection("videos")
      .findOne({ _id: new ObjectId(videoId) });

    if (!videoData) {
      return NextResponse.json({ error: "Video not found!" }, { status: 404 });
    }

    const ownerId = videoData.userId?.toString();
    const isOwner = currentUserId && ownerId === currentUserId;

    if (videoData.mode === "private") {
      if (!isOwner) {
        return NextResponse.json(
          { error: "This video is private" },
          { status: 403 },
        );
      }
    } else if (videoData.mode === "restricted") {
      const isAllowed = videoData.allowedUsers?.some(
        (userObj) => userObj._id.toString() === currentUserId,
      );
      if (!isAllowed && !isOwner) {
        return NextResponse.json(
          { error: "You don't have permission to view this video" },
          { status: 403 },
        );
      }
    }

    const video = await db.collection("videos").findOne(
      { _id: new ObjectId(videoId) },
      {
        projection: {
          userId: 0,
          mode: 0,
          allowedUsers: 0,
        },
      },
    );

    const subtitles = await db
      .collection("subtitle")
      .find({ videoId: new ObjectId(videoId) })
      .project({ userId: 0 })
      .toArray();

    const summaries = await db
      .collection("summary")
      .find({ videoId: new ObjectId(videoId) })
      .project({ userId: 0 })
      .toArray();

    return NextResponse.json({ video, subtitles, summaries, isOwner });
  } catch (error) {
    console.error("Error fetching stream data:", error);
    return NextResponse.json(
      { error: "Failed to fetch stream data!" },
      { status: 500 },
    );
  }
}
