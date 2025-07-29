"use server";

import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { spawn } from "child_process";

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DB_NAME || "magicsub_db");
  }
  return db;
}

async function getYoutubeMetadataAndDirectUrl(url) {
  return new Promise((resolve, reject) => {
    const proc = spawn("yt-dlp", ["--dump-json", "-f", "18", url]);
    let data = "";

    proc.stdout.on("data", (chunk) => {
      data += chunk.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        try {
          const metadata = JSON.parse(data);
          resolve(metadata);
        } catch (e) {
          reject(new Error("Failed to parse metadata"));
        }
      } else {
        reject(new Error("yt-dlp process failed"));
      }
    });

    proc.on("error", reject);
  });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { originalUrl, _id } = await req.json();
    if (!originalUrl || !_id) {
      return NextResponse.json(
        { message: "Missing URL or videoId" },
        { status: 400 }
      );
    }

    const metadata = await getYoutubeMetadataAndDirectUrl(originalUrl);
    const directUrl =
      metadata.url || metadata.direct_url || metadata.url_list?.[0] || null;

    const db = await connectDB();
    const result = await db
      .collection("videos")
      .updateOne(
        { _id: new ObjectId(_id), userId: new ObjectId(session.user.id) },
        { $set: { directUrl } }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Direct URL updated",
      directUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Direct URL update failed." },
      { status: 500 }
    );
  }
}
