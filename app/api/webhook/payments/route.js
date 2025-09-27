"use server";
import crypto from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
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

function getGemsByPlan(planName) {
  if (!planName) return 0;
  const normalized = planName.toLowerCase();
  if (normalized.includes("starter")) return 250;
  if (normalized.includes("plus")) return 500;
  if (normalized.includes("pro")) return 1000;
  return 0;
}

export async function POST(request) {
  try {
    // configure webhook
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
    console.log(data)
    console.dir(data, { depth: null, colors: true });

    const db = await connectDB();

    const updateSubscription = () => {
      const userId = data.meta.custom_data.user_id;
      const subscriptionId = data.data.id;

      return db.collection("users").updateOne(
        { _id: new ObjectId(userId), "subscriptions.id": subscriptionId },
        {
          $set: {
            "subscriptions.$.status": data.data.attributes.status,
            "subscriptions.$.renewsAt": data.data.attributes.renews_at,
            "subscriptions.$.endsAt": data.data.attributes.ends_at,
            "subscriptions.$.name": data.data.attributes.product_name,
          },
        }
      );
    };

    // Khi user mới tạo subscription
    if (data.meta.event_name === "subscription_created") {
      const newSubscription = {
        id: data.data.id,
        createdAt: data.data.attributes.created_at,
        name: data.data.attributes.product_name,
        status: data.data.attributes.status,
        renewsAt: data.data.attributes.renews_at,
        endsAt: data.data.attributes.ends_at,
      };

      const gems = getGemsByPlan(data.data.attributes.product_name);

      await db.collection("users").updateOne(
        { _id: new ObjectId(data.meta.custom_data.user_id) },
        {
          $push: { subscriptions: newSubscription },
          $set: { gems },
        }
      );
    }

    else if (data.meta.event_name === "subscription_payment_success") {
      const gems = getGemsByPlan(data.data.attributes.product_name);
      await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(data.meta.custom_data.user_id) },
          { $set: { gems } }
        );
    } else {
      await updateSubscription();
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
