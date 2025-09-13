import { NextResponse } from "next/server";

// 🔹 Helper functions
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
    console.log(customize.background_opacity);
    const alpha = (255 - Math.round((customize.background_opacity / 100) * 255))
      .toString(16)
      .padStart(2, "0");
    console.log(alpha);
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

// 🔹 API POST
export async function POST(req) {
  try {
    const body = await req.json();
    const { subtitle, customize } = body;

    if (!subtitle || !customize) {
      return NextResponse.json(
        { error: "Missing subtitle or customize" },
        { status: 400 }
      );
    }

    const assContent = generateASS(subtitle, customize);

    return new NextResponse(assContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": "attachment; filename=subtitles.ass",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
