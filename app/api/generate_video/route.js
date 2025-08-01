import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

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

    // Lưu vào thư mục download (cùng cấp app/)
    const downloadDir = path.join(process.cwd(), "download");
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const assFilePath = path.join(downloadDir, `subtitles_${Date.now()}.ass`);
    const outputFilePath = path.join(downloadDir, `output_${Date.now()}.mp4`);

    // Write ASS content to file
    fs.writeFileSync(assFilePath, assContent);

    // Run ffmpeg để chèn sub vào video
    await new Promise((resolve, reject) => {
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
        outputFilePath,
      ]);

      ffmpeg.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });
    });

    return NextResponse.json({
      message: "Video generated successfully.",
      downloadPath: `/download/${path.basename(outputFilePath)}`,
      ass: assContent
    });
  } catch (error) {
    console.error(error);
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
