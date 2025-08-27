import { NextResponse } from "next/server";
import { listProducts, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

export async function GET() {
  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });

  const products = await listProducts({
    filter: { storeId: process.env.LEMONSQUEEZY_STORE_ID },
  });

  return NextResponse.json(products?.data || []);
}
