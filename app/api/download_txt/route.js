import { NextResponse } from "next/server";

// 🔹 API POST
export async function POST(req) {
  try {
    const body = await req.json();
    const { subtitle } = body;

    if (!subtitle || !Array.isArray(subtitle)) {
      return NextResponse.json(
        { error: "No subtitle provided or wrong format" },
        { status: 400 }
      );
    }

    // Lấy text của từng object và nối thành plain text
    const plainText = subtitle.map((sub) => sub.text).join("\n\n");

    return new NextResponse(plainText, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": "attachment; filename=subtitles.txt",
      },
    });
  } catch (error) {
    console.error("Error generating txt:", error);
    return NextResponse.json(
      { error: "Failed to generate txt file" },
      { status: 500 }
    );
  }
}
