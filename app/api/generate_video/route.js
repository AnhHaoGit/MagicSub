import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { MongoClient, ObjectId } from "mongodb";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
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

// Ghi ffmpeg output ra file tạm mp4
// Ghi ffmpeg output ra file tạm mp4
async function generateTempMp4(cloudUrl, assPath, outputPath, endpoints) {
  return new Promise((resolve, reject) => {
    const fontsDir = path.join(process.cwd(), "public", "fonts");
    const [start, end] = endpoints; // lấy thời gian bắt đầu và kết thúc
    const duration = end - start;

    const ffmpeg = spawn("ffmpeg", [
      "-ss",
      start.toString(),
      "-t",
      duration.toString(),
      "-i",
      cloudUrl,
      "-vf",
      `ass=${assPath}:fontsdir=${fontsDir}`,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "21",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      "-f",
      "mp4",
      outputPath,
    ]);

    ffmpeg.stderr.on("data", (d) => console.log("ffmpeg:", d.toString()));
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

// Multipart upload từng phần ~500MB lên S3
async function multipartUpload(
  filePath,
  bucket,
  key,
  partSize = 500 * 1024 * 1024
) {
  const stat = await fs.stat(filePath);
  const totalSize = stat.size;
  const createRes = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: "video/mp4",
    })
  );
  const uploadId = createRes.UploadId;
  const parts = [];
  let partNumber = 1;
  let start = 0;
  const fd = await fs.open(filePath, "r");

  while (start < totalSize) {
    const end = Math.min(start + partSize, totalSize);
    const buffer = Buffer.alloc(end - start);
    await fd.read(buffer, 0, end - start, start);

    const uploadRes = await s3.send(
      new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        PartNumber: partNumber,
        UploadId: uploadId,
        Body: buffer,
      })
    );
    parts.push({ ETag: uploadRes.ETag, PartNumber: partNumber });

    start = end;
    partNumber += 1;
  }
  await fd.close();

  await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })
  );
}

export async function POST(req) {
  try {
    const { subtitle, customize, cloudUrl, videoId, userId, endpoints } =
      await req.json();

    const now = Date.now();
    const Key = `generated_videos/video_${now}.mp4`;

    // Tạo file ASS tạm
    const adjustedSubtitles = adjustSubtitleTimestamps(subtitle, endpoints[0]);
    const assContent = generateASS(adjustedSubtitles, customize);
    const assPath = path.join(os.tmpdir(), `sub_${now}.ass`);
    await fs.writeFile(assPath, assContent, { encoding: "utf8" });

    // Tạo file mp4 tạm
    const tempMp4 = path.join(os.tmpdir(), `video_${now}.mp4`);
    await generateTempMp4(cloudUrl, assPath, tempMp4, endpoints);

    // Multipart upload lên S3
    await multipartUpload(tempMp4, process.env.AWS_S3_BUCKET, Key);

    // Xóa file tạm
    await fs.unlink(assPath);
    await fs.unlink(tempMp4);

    const videoUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`;

    const db = await connectDB();
    const collection = db.collection("videos");
    const date = new Date();
    const newEntry = { id: now, url: videoUrl, createdAt: date.toISOString() };

    await collection.updateOne(
      { _id: new ObjectId(videoId), userId: new ObjectId(userId) },
      { $push: { cloudUrls: newEntry } },
      { upsert: true }
    );

    return NextResponse.json({
      message: "Video uploaded successfully",
      cloudUrl: newEntry,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error. Try again later." },
      { status: 500 }
    );
  }
}

function generateASS(subtitles, customize) {
  const styleName = "Default";

  const assHeader = `ScriptType: v4.00+
Collisions: Normal
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ${styleName},${customize.font_family},${customize.font_size},${fontColor(
    customize.font_color
  )},${fontColor(customize.font_color)},${borderColor(customize)},${borderColor(
    customize
  )},${customize.is_bold ? -1 : 0},${customize.is_italic ? -1 : 0},${
    customize.is_underline ? -1 : 0
  },0,100,100,0,0,${customize.border_style === "opaque_box" ? 3 : 1},${
    customize.outline_width
  },0,2,10,10,${
    customize.position === "top"
      ? "240"
      : customize.position === "middle"
      ? "127"
      : "15"
  },1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const assEvents = subtitles
    .map(
      (sub) =>
        `Dialogue: 0,${formatTime(sub.start)},${formatTime(
          sub.end
        )},${styleName},,0,0,0,,${sub.text.replace(/\n/g, "\\N")}`
    )
    .join("\n");

  return `${assHeader}\n${assEvents}`;
}

function formatTime(time) {
  const [hms, ms] = time.split(",");
  const [h, m, s] = hms.split(":");
  const trimmedMs = ms.substring(0, 2).padEnd(2, "0");
  return `${parseInt(h)}:${m}:${s}.${trimmedMs}`;
}

function fontColor(color) {
  const b = color.substring(5, 7);
  const g = color.substring(3, 5);
  const r = color.substring(1, 3);
  return `&H${b}${g}${r}`.toUpperCase();
}

function borderColor(customize) {
  if (customize.border_style === "opaque_box") {
    const alpha = (255 - Math.round((customize.background_opacity / 100) * 255))
      .toString(16)
      .padStart(2, "0");
    const b = customize.background_color.substring(5, 7);
    const g = customize.background_color.substring(3, 5);
    const r = customize.background_color.substring(1, 3);
    return `&H${alpha}${b}${g}${r}`.toUpperCase();
  } else {
    const b = customize.outline_color.substring(5, 7);
    const g = customize.outline_color.substring(3, 5);
    const r = customize.outline_color.substring(1, 3);
    return `&H${b}${g}${r}`.toUpperCase();
  }
}

function adjustSubtitleTimestamps(subtitles, startOffset) {
  return subtitles.map((sub) => {
    const startSeconds = timeToSeconds(sub.start) - startOffset;
    const endSeconds = timeToSeconds(sub.end) - startOffset;

    return {
      ...sub,
      start: secondsToAssTime(startSeconds),
      end: secondsToAssTime(endSeconds),
    };
  });
}

function timeToSeconds(time) {
  // chuyển từ "00:05:12,345" → 312.345 (giây)
  const [hms, ms] = time.split(",");
  const [h, m, s] = hms.split(":").map(Number);
  return h * 3600 + m * 60 + s + parseInt(ms) / 1000;
}

function secondsToAssTime(seconds) {
  if (seconds < 0) seconds = 0;

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000); // phần thập phân của giây → mili giây

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
    s
  ).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}
