"use server";

import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { MongoClient } from "mongodb";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


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
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ message: "Missing URL" }, { status: 400 });
    }

    const outputDir = path.join(process.cwd(), "downloads");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const command = `yt-dlp -o "${outputDir}/yt_video.%(ext)s" --print-json "${url}"`;
    const { stdout } = await execPromise(command);
    const videoInfo = JSON.parse(stdout.split("\n")[0]);

    const filePath = path.join(outputDir, `yt_video.${videoInfo.ext}`);

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "video",
      folder: "youtube_downloads",
      public_id: `yt_${Date.now()}`,
    });

    fs.unlinkSync(filePath);

    const videoData = {
      _id: result.public_id.split("/")[1],
      title: result.original_filename,
      cloudUrl: result.secure_url,
      duration: result.duration,
      originalUrl: url,
      createdAt: new Date(),
    };


    const db = await connectDB();
    await db.collection("videos").insertOne(videoData);


    return NextResponse.json({
      message: "Uploaded successfully",
      video: {
        title: videoData.title,
        cloudUrl: videoData.cloudUrl,
        duration: videoData.duration,
        publicId: videoData._id,
        originalUrl: videoData.originalUrl,
      },
    });
  } catch (error) {
    console.error("Upload or save failed:", error);
    return NextResponse.json(
      { message: "Upload or save failed" },
      { status: 500 }
    );
  }
}
