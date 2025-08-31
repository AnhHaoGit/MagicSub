'use server';

import { NextResponse } from "next/server";
import {
  lemonSqueezySetup,
  getSubscription,
} from "@lemonsqueezy/lemonsqueezy.js";

export async function POST(req) {
  try {
    lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });
    const { subscription_id } = await req.json();

    if (!subscription_id) {
      return NextResponse.json(
        { error: "Missing subscription_id" },
        { status: 400 }
      );
    }


    // Lấy thông tin subscription
    const { data } = await getSubscription(subscription_id);
    const portalUrl =
      data?.data?.attributes?.urls?.customer_portal_update_subscription;

    if (!portalUrl) {
      return NextResponse.json(
        { error: "No customer portal URL found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ portal_url: portalUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
