import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import { MongoClient, ObjectId } from "mongodb";


// AWS S3 config
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

export async function POST(req) {
  try {
    const { subtitle, customize, cloudUrl, videoId, userId } = await req.json();

    if (!subtitle || !customize || !cloudUrl || !videoId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const now = Date.now()

    // 🔹 Generate ASS content
    const assContent = generateASS(subtitle, customize);
    const assPath = `/tmp/subtitles_${Date.now()}.ass`;
    await fs.promises.writeFile(assPath, assContent);

    // 🔹 Output file path
    const outputPath = `/tmp/output_${Date.now()}.mp4`;

    // 🔹 Run ffmpeg và lưu vào local file
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        cloudUrl,
        "-vf",
        `ass=${assPath}`,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "23",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        outputPath,
      ]);

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });
    });

    // 🔹 Upload file local lên S3
    const Key = `generated_videos/video_${now}.mp4`;
    const fileStream = fs.createReadStream(outputPath);

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key,
        Body: fileStream,
        ContentType: "video/mp4",
      })
    );

    // 🔹 Tạo URL
    const videoUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`;

    // (optional) Xóa file local sau khi upload xong
    await fs.promises.unlink(outputPath);
    await fs.promises.unlink(assPath);

    const db = await connectDB();
    const collection = db.collection("videos");

    const newEntry = { id: now, url: videoUrl };

    await collection.updateOne(
     { _id: new ObjectId(videoId), userId: new ObjectId(userId) },
     { $push: { cloudUrls: newEntry } }, // thêm vào mảng
     { upsert: true } // nếu chưa có document thì tạo mới
    );

    return NextResponse.json({
      message: "Video uploaded successfully",
      cloudUrl: newEntry,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
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
  },0,2,10,10,${customize.margin_bottom},1

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
  return `&H00${b}${g}${r}`.toUpperCase();
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
    return `&HFF${b}${g}${r}`.toUpperCase();
  }
}
