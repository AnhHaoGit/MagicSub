"use server";
import crypto from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import {
  lemonSqueezySetup,
  getSubscription,
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
    console.log(
      "webhook event:",
      data?.meta?.event_name,
      "| updated_at:",
      new Date(data?.data?.attributes?.updated_at).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      })
    );

    console.dir(data, { depth: null, colors: true });

    const db = await connectDB();
    const userId = new ObjectId(data.meta.custom_data.user_id);

    // ✅ Khi tạo subscription mới → ghi đè object subscription
    if (data.meta.event_name === "subscription_created") {
      const gems = getGemsByPlan(data.data.attributes.product_name);
      const user = await db.collection("users").findOne({ _id: userId });

      if (user?.subscription) {
        const oldSubId = user.subscription.data.id;
        console.log("Cancelling old subscription:", oldSubId);
        await cancelSubscription(oldSubId);
      }

      await db.collection("users").updateOne(
        { _id: userId },
        {
          $set: {
            subscription: data,
            gems,
          },
        }
      );
    }

    // ✅ Cập nhật subscription đang có
    else if (
      data.meta.event_name === "subscription_updated" ||
      data.meta.event_name === "subscription_resumed" ||
      data.meta.event_name === "subscription_paused" ||
      data.meta.event_name === "subscription_unpaused"
    ) {
      await db
        .collection("users")
        .updateOne({ _id: userId }, { $set: { subscription: data } });
    }

    // ✅ Khi hết hạn hoặc hủy → reset gems về 0
    else if (data.meta.event_name === "subscription_expired") {
      const user = await db.collection("users").findOne({ _id: userId });

      if (user?.subscription?.data?.id === data.data.id) {
        await db.collection("users").updateOne(
          { _id: userId },
          {
            $set: { subscription: data, gems: 0 },
          }
        );
      }
    } else if (data.meta.event_name === "subscription_cancelled") {
      const user = await db.collection("users").findOne({ _id: userId });

      if (user?.subscription?.data?.id === data.data.id) {
        await db.collection("users").updateOne(
          { _id: userId },
          {
            $set: { subscription: data },
          }
        );
      }
    }

    // ✅ Khi thanh toán thành công → cập nhật lại gems theo plan
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
    // thanh toán không thành công, reset gems về 0
    else if (data.meta.event_name === "subscription_payment_failed") {
      await db
        .collection("users")
        .updateOne({ _id: userId }, { $set: { gems: 0 } });
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
