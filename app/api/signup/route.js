import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

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
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { message: "Missing email or password" },
      { status: 400 }
    );
  }

  const db = await connectDB();
  const usersCollection = db.collection("users");

  const existingUser = await usersCollection.findOne({ email });

  if (existingUser) {
    return NextResponse.json(
      { message: "User already exists" },
      { status: 400 }
    );
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  await usersCollection.insertOne({
    email,
    password: hashedPassword,
  });

  return NextResponse.json({ message: "User created" });
}
