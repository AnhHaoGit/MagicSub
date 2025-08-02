import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { v2 as cloudinary } from "cloudinary";
import stream from "stream";
import { Buffer } from "buffer";
import fs from "fs";
import path from "path";

// Config Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    const { subtitle, customize, directUrl } = await req.json();

    if (!subtitle || !customize || !directUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const assContent = generateASS(subtitle, customize);

    // Tạo file ASS tạm trong RAM (ffmpeg yêu cầu file path)
    const assFilePath = `/tmp/subtitles_${Date.now()}.ass`;
    fs.writeFileSync(assFilePath, assContent);

    // Spawn ffmpeg để xuất ra stdout (pipe:1)
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      directUrl,
      "-vf",
      `ass=${assFilePath}`,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "copy",
      "-f",
      "mp4",
      "pipe:1",
    ]);

    let videoBuffers = [];

    ffmpeg.stdout.on("data", (chunk) => {
      videoBuffers.push(chunk);
    });

    ffmpeg.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    const ffmpegExitCode = await new Promise((resolve) => {
      ffmpeg.on("close", resolve);
    });

    // Xóa file ASS tạm sau khi xong
    fs.unlinkSync(assFilePath);

    if (ffmpegExitCode !== 0) {
      throw new Error(`FFmpeg exited with code ${ffmpegExitCode}`);
    }

    // Combine all chunks into one buffer
    const finalVideoBuffer = Buffer.concat(videoBuffers);

    // Upload buffer to Cloudinary using upload_stream with a PassThrough stream
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "video", folder: "generated_videos" },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      const passthrough = new stream.PassThrough();
      passthrough.end(finalVideoBuffer);
      passthrough.pipe(uploadStream);
    });

    return NextResponse.json({
      message: "Video uploaded successfully.",
      videoUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
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
