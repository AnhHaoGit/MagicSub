import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "Missing fileName or fileType" },
        { status: 400 }
      );
    }

    const key = `uploads/${uuidv4()}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({
      ok: true,
      uploadUrl,
      fileUrl,
      uploadKey: key
    });
  } catch (err) {
    console.error("Error creating presigned URL:", err);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
