// /app/api/cancel_subscription/route.js

"use server";
import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import {
  lemonSqueezySetup,
  cancelSubscription,
} from "@lemonsqueezy/lemonsqueezy.js";

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DB_NAME || "magicsub_db");
  }
  return db;
}

export async function POST(request) {
  try {
    const { subscriptionId, userId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required" },
        { status: 400 }
      );
    }

    lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });

    const { error } = await cancelSubscription(subscriptionId);
    if (error) {
      console.error("Lemon API error:", error);
      return NextResponse.json(
        { error: "Failed to cancel subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Subscription cancelled" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Cancel subscription error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
