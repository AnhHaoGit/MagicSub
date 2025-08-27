import { createCheckout, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";
import { NextResponse } from "next/server";


export async function POST(req) {
  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });

  const { variantId, userEmail, userId, embed } = await req.json();

  const checkout = await createCheckout(
    process.env.LEMONSQUEEZY_STORE_ID,
    variantId,
    {
      checkoutOptions: {
        embed,
        media: true,
        logo: !embed,
      },
      checkoutData: {
        email: userEmail,
        custom: {
          user_id: userId,
        },
      },
      productOptions: {
        enabledVariants: [parseInt(variantId)],
        redirectUrl: `http://localhost:3000/`,
      },
    }
  );

  if (!checkout.data?.data?.attributes?.url) {
    console.error("Failed to create checkout URL");
    return null;
  }

  return NextResponse.json({ url: checkout.data?.data?.attributes?.url });
}
