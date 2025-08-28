import { NextResponse } from "next/server";
import {
  listProducts,
  lemonSqueezySetup,
  listVariants,
  createCheckout,
} from "@lemonsqueezy/lemonsqueezy.js";

export async function POST(req) {
  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });

  const { userEmail, userId, embed } = await req.json();

  const products = await listProducts({
    filter: { storeId: process.env.LEMONSQUEEZY_STORE_ID },
  });

  const productsData = await Promise.all(
    products.data.data.map(async (product) => {
      console.log(product.id);
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

      console.log(variantId)

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
      const checkoutUrl = checkout.data?.data?.attributes?.url || null;

      console.log(checkoutUrl)

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
}
