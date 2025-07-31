import { NextResponse } from "next/server";

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

    return NextResponse.json(assContent);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

function generateASS(subtitles, customize) {
  const styleName = "CustomStyle";

  const assHeader = `[Script Info]
ScriptType: v4.00+
Collisions: Normal
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ${styleName},${customize.font_family},${
    customize.font_size
  },&H${hexColor(customize.font_color)},&HFFFFFF,&H${outlineHex(
    customize.outline_color
  )},&H${backgroundHex(
    customize.background_color,
    customize.background_opacity
  )},${customize.is_bold ? -1 : 0},${customize.is_italic ? -1 : 0},${
    customize.is_underline ? -1 : 0
  },0,100,100,0,0,${customize.border_style === "boxed" ? 3 : 1},${
    customize.outline_width
  },${customize.text_shadow || 0},2,10,10,${customize.margin_bottom},0

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
  return `${h}:${m}:${s}.${ms.padEnd(2, "0")}`;
}

// Primary Colour, Secondary Colour vẫn giữ alpha là 00 (đục hoàn toàn)
function hexColor(color) {
  const r = color.substring(1, 3);
  const g = color.substring(3, 5);
  const b = color.substring(5, 7);
  return `00${b}${g}${r}`.toUpperCase(); // Alpha 00 (solid)
}

// Outline Colour → luôn set Alpha = FF (opacity 100%)
function outlineHex(color) {
  const r = color.substring(1, 3);
  const g = color.substring(3, 5);
  const b = color.substring(5, 7);
  return `FF${b}${g}${r}`.toUpperCase(); // Alpha FF (solid)
}

// Background Color theo opacity (0-100)
function backgroundHex(color, opacity) {
  const alpha = (255 - Math.round((opacity / 100) * 255))
    .toString(16)
    .padStart(2, "0");
  const r = color.substring(1, 3);
  const g = color.substring(3, 5);
  const b = color.substring(5, 7);
  return `${alpha}${b}${g}${r}`.toUpperCase(); // Alpha BGRR
}
