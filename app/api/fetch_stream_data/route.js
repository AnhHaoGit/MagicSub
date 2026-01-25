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
  const { videoId, subtitleId } = await req.json();

  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id?.toString();

    const db = await connectDB();

    const video = await db
      .collection("videos")
      .findOne({ _id: new ObjectId(videoId) });

    const subtitle = await db
      .collection("subtitle")
      .findOne({ _id: new ObjectId(subtitleId) });

    if (!video || !subtitle) {
      return NextResponse.json({ error: "Data not found!" }, { status: 404 });
    }

    const isSubtitleOwner =
      currentUserId && subtitle.userId.toString() === currentUserId;

    const isVideoPublic = video.mode === "public";
    const isUserInVideoAllowedList = video.allowedUsers?.some(
      (userObj) => userObj._id.toString() === currentUserId,
    );
    const isVideoOwner =
      currentUserId && video.userId?.toString() === currentUserId;

    const hasAccessToContent =
      isSubtitleOwner ||
      isVideoPublic ||
      isUserInVideoAllowedList ||
      isVideoOwner;

    if (subtitle.locked === true && !hasAccessToContent) {
      return NextResponse.json(
        { error: "This content is private." },
        { status: 403 },
      );
    }

    return NextResponse.json({ video, subtitle, isOwner: isSubtitleOwner });
  } catch (error) {
    console.error("Error fetching stream data:", error);
    return NextResponse.json(
      { error: "Failed to fetch stream data!" },
      { status: 500 },
    );
  }
}
