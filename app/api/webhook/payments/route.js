"use server";
import crypto from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import {
  lemonSqueezySetup,
  getSubscription,
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

function getGemsByPlan(planName) {
  if (!planName) return 0;
  const normalized = planName.toLowerCase();
  if (normalized.includes("starter")) return 250;
  if (normalized.includes("plus")) return 500;
  if (normalized.includes("pro")) return 1000;
  return 0;
}

async function getSubscriptionData(subscription_id) {
  try {
    lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });
    const { data } = await getSubscription(subscription_id);
    return data;
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return {
      error: true,
      message: error.message || "Failed to fetch subscription",
    };
  }
}

export async function POST(request) {
  try {
    if (!process.env.LEMONSQUEEZY_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Lemon Squeezy Webhook Secret not set in .env" },
        { status: 500 }
      );
    }

    const rawBody = await request.text();
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signature = Buffer.from(
      request.headers.get("X-Signature") || "",
      "utf8"
    );

    if (!crypto.timingSafeEqual(digest, signature)) {
      return NextResponse.json(
        { error: "Invalid signature." },
        { status: 400 }
      );
    }

    const data = JSON.parse(rawBody);
    console.log("webhook data:", data);
    console.dir(data, { depth: null, colors: true });

    const db = await connectDB();
    const userId = new ObjectId(data.meta.custom_data.user_id);

    // ✅ Thêm mới object vào mảng subscriptions
    if (data.meta.event_name === "subscription_created") {
      const gems = getGemsByPlan(data.data.attributes.product_name);
      await db.collection("users").updateOne(
        { _id: userId },
        {
          $push: { subscriptions: data }, // thêm vào mảng
          $set: { gems },
        }
      );
    }

    // cập nhật một subscription có sẵn (cần lọc theo id nếu muốn cập nhật từng item)
    else if (
      data.meta.event_name === "subscription_updated" ||
      data.meta.event_name === "subscription_resumed" ||
      data.meta.event_name === "subscription_paused" ||
      data.meta.event_name === "subscription_unpaused"
    ) {
      await db.collection("users").updateOne(
        { _id: userId, "subscriptions.data.id": data.data.id },
        { $set: { "subscriptions.$": data } }
      );
    }

    // khi hết hạn hoặc hủy, set gems = 0
    else if (
      data.meta.event_name === "subscription_expired" ||
      data.meta.event_name === "subscription_cancelled"
    ) {
      await db.collection("users").updateOne(
        { _id: userId, "subscriptions.data.id": data.data.id },
        {
          $set: { "subscriptions.$": data, gems: 0 },
        }
      );
    }

    // thanh toán thành công, gia hạn cho payment, cập nhật lại gems
    else if (data.meta.event_name === "subscription_payment_success") {
      const subscriptionData = await getSubscriptionData(
        data.data.attributes.subscription_id
      );
      if (subscriptionData.error) {
        console.error(
          "Failed to fetch subscription data:",
          subscriptionData.message
        );
        return NextResponse.json(
          { error: "Failed to fetch subscription data" },
          { status: 500 }
        );
      }

      const gems = getGemsByPlan(subscriptionData.data.attributes.product_name);
      await db
        .collection("users")
        .updateOne({ _id: userId }, { $set: { gems } });
    }

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
