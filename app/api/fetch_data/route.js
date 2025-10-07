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

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  try {
    const db = await connectDB();

    // Lấy danh sách video, subtitle, summary
    const videos = await db
      .collection("videos")
      .find({ userId: new ObjectId(userId) })
      .toArray();

    const subtitles = await db
      .collection("subtitle")
      .find({ userId: new ObjectId(userId) })
      .toArray();

    const summaries = await db
      .collection("summary")
      .find({ userId: new ObjectId(userId) })
      .toArray();

    // Gộp dữ liệu theo video
    const mergedVideos = videos.map((video) => {
      const videoSubtitles = subtitles.filter(
        (sub) => sub.videoId.toString() === video._id.toString()
      );

      const videoSummaries = summaries.filter(
        (sum) => sum.videoId.toString() === video._id.toString()
      );

      return {
        ...video,
        subtitles: videoSubtitles,
        summaries: videoSummaries,
      };
    });

    return NextResponse.json(mergedVideos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
