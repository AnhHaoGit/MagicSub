import { NextResponse } from "next/server";

function convertToSrt(subtitle) {
  return subtitle
    .map((item, i) => {
      return `${i + 1}\n${item.start.replace(".", ",")} --> ${item.end.replace(
        ".",
        ","
      )}\n${item.text}\n`;
    })
    .join("\n");
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { subtitle } = body;

    if (!subtitle || !Array.isArray(subtitle)) {
      return NextResponse.json(
        { error: "Invalid subtitle format" },
        { status: 400 }
      );
    }

    const srtContent = convertToSrt(subtitle);

    return new NextResponse(srtContent, {
      status: 200,
      headers: {
        "Content-Type": "application/x-subrip",
        "Content-Disposition": "attachment; filename=subtitles.srt",
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
