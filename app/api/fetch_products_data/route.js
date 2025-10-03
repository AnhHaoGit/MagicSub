import { NextResponse } from "next/server";
import {
  listProducts,
  lemonSqueezySetup,
  listVariants,
  createCheckout,
} from "@lemonsqueezy/lemonsqueezy.js";

export async function POST(req) {
  try {
    // configure
    lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });


    const { userEmail, userId, embed } = await req.json();
    console.log("Fetching products data for:", userEmail, userId);

    // fetching all products from the store
    const products = await listProducts({
      filter: { storeId: process.env.LEMONSQUEEZY_STORE_ID },
    });

    const productsData = await Promise.all(
      products.data.data.map(async (product) => {
        const variant = await listVariants({
          filter: {
            productId: product.id,
          },
        });
        if (!variant) {
          return {
            ...product.attributes,
            id: product.id,
            checkoutUrl: null,
          };
        }
        const variantId = variant.data.data[0].id;


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
              redirectUrl: process.env.NEXTAUTH_URL,
            },
          }
        );
        const checkoutUrl = checkout.data?.data?.attributes?.url || null;


        if (checkoutUrl === null) {
          console.error("Failed to create checkout URL");
          return null;
        }

        return {
          ...product.attributes,
          id: product.id,
          checkoutUrl,
        };
      })
    );

    return NextResponse.json(productsData || []);

  } catch (error) {
    return NextResponse.json(
      { message: "Direct URL update failed." },
      { status: 500 }
    );
  }
}
