import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      fileName,
      fileType,
      userId,
      title,
      size,
      duration,
      createdAt
    } = body;

    console.log(createdAt)

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "Missing fileName or fileType" },
        { status: 400 }
      );
    }

    const key = `uploads/${Date.now()}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 }); // URL hết hạn sau 60 giây

    const db = await connectDB();
    const result = await db.collection("videos").insertOne({
      userId: new ObjectId(userId),
      cloudUrl: fileUrl,
      title,
      size,
      duration,
      createdAt
    });

    return NextResponse.json({
      _id: result.insertedId,
      uploadUrl,
      userId,
      cloudUrl: fileUrl,
      title,
      size,
      duration,
      createdAt
    });
  } catch (err) {
    console.error("Error creating presigned URL:", err);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
