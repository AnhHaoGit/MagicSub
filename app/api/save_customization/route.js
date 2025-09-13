import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DB_NAME || "magicsub_db");
  }
  return db;
}

export async function PUT(req) {
  try {
    const { videoId, customize } = await req.json();

    console.log("Received data:", { videoId, customize });


    if (!videoId || !customize) {
      return NextResponse.json(
        { message: "Missing parameters" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const collection = db.collection("videos");

    await collection.updateOne(
      { _id: new ObjectId(videoId) },
      { $set: { customize: customize } },
      { upsert: true } // If not exist, create new
    );

    return NextResponse.json(
      { message: "Customization updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
