"use server";
import { getProductVariant } from "@/lib/lemon-squeezy/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertProduct } from "@/lib/supabase/database/products";
import { insertSubscription } from "@/lib/supabase/database/subscriptions";
import { updateCustomerId } from "@/lib/supabase/database/users";
import crypto from "node:crypto";

const subscriptionEvents = [
  "subscription_created",
  "subscription_updated",
  "subscription_resumed",
  "subscription_paused",
  "subscription_cancelled",
  "subscription_unpaused",
  "subscription_expired",
];

export async function POST(request) {
  if (!process.env.LEMONSQUEEZY_WEBHOOK_SECRET) {
    return new Response("Lemon Squeezy Webhook Secret not set in .env", {
      status: 500,
    });
  }

  // First, make sure the request is from Lemon Squeezy.
  const rawBody = await request.text();
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  const hmac = crypto.createHmac("sha256", secret);
  const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
  const signature = Buffer.from(
    request.headers.get("X-Signature") || "",
    "utf8"
  );

  if (!crypto.timingSafeEqual(digest, signature)) {
    return new Response("Invalid signature.", { status: 400 });
  }

  const data = JSON.parse(rawBody);

  if (subscriptionEvents.includes(data.meta.event_name)) {
    const userId = data.meta.custom_data?.user_id;
    if (!userId) {
      return new Response("User ID not found", { status: 400 });
    }

    const subscription = data.data;
    const productId = subscription.attributes.product_id;
    const variantId = subscription.attributes.variant_id;
    const productName = subscription.attributes.product_name;
    const variant = await getProductVariant(variantId);
    const price = variant?.attributes?.price;

    const supabaseAdmin = await createAdminClient();

    const customerId = subscription.attributes.customer_id;
    if (!customerId) {
      return new Response("Customer ID not found", { status: 400 });
    }
    const productUpsert = upsertProduct(supabaseAdmin, {
      variant_id: variantId.toString(),
      product_id: productId.toString(),
      name: productName,
      price: price,
    });

    const customerUpsert = updateCustomerId(supabaseAdmin, {
      userId,
      customerId: customerId.toString(),
    });

    await Promise.all([productUpsert, customerUpsert]);

    await insertSubscription(supabaseAdmin, {
      customerId: customerId.toString(),
      subscriptionId:
        subscription.attributes.first_subscription_item.subscription_id,
      productId: productId.toString(),
      variantId: variantId.toString(),
      status: subscription.attributes.status,
      cancelled: subscription.attributes.cancelled,
      renewsAt: subscription.attributes.renews_at,
      endsAt: subscription.attributes.ends_at,
      createdAt: subscription.attributes.created_at,
      updatedAt: subscription.attributes.updated_at,
    });

    return new Response("Order Complete", { status: 200 });
  }

  return new Response("Webhook received", { status: 200 });
}
