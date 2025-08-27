"use server";

import {
  createCheckout,
  getSubscription,
  getVariant,
  lemonSqueezySetup,
  listProducts,
  listVariants,
} from "@lemonsqueezy/lemonsqueezy.js";

export async function configureLemonSqueezy() {
  const requiredVars = [
    "LEMONSQUEEZY_API_KEY",
    "LEMONSQUEEZY_STORE_ID",
    "LEMONSQUEEZY_WEBHOOK_SECRET",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    return {
      error: `Missing required LEMONSQUEEZY env variables: ${missingVars.join(
        ", "
      )}. Please, set them in your .env file.`,
    };
  }

  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });
  return { error: null };
}

export async function getAllProducts() {
  const { error } = await configureLemonSqueezy();
  if (error) {
    console.error(error);
    return [];
  }
  const products = await listProducts({
    filter: {
      storeId: process.env.LEMONSQUEEZY_STORE_ID,
    },
  });

  if (!products.data) {
    return [];
  }

  return products.data.data;
}

export async function getFirstVariant(productId) {
  const { error } = await configureLemonSqueezy();
  if (error) {
    console.error(error);
    return null;
  }
  const variants = await listVariants({
    filter: {
      productId,
    },
  });

  if (!variants.data) {
    return null;
  }

  return variants.data.data[0];
}

export async function createCheckoutUrl({
  variantId,
  userEmail = "",
  userId = "",
  embed = false,
}) {
  const { error } = await configureLemonSqueezy();
  if (error) {
    console.error(error);
    return null;
  }

  if (!process.env.LEMONSQUEEZY_STORE_ID) {
    console.error(
      "LEMONSQUEEZY_STORE_ID is not defined in environment variables"
    );
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.warn(
      "NEXT_PUBLIC_APP_URL is not defined, using default redirect URL"
    );
    return null;
  }

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
        redirectUrl: `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/`,
      },
    }
  );

  if (!checkout.data?.data?.attributes?.url) {
    console.error("Failed to create checkout URL");
    return null;
  }

  return checkout.data?.data?.attributes?.url;
}

export async function createCustomerPortal(subscriptionId) {
  const { error } = await configureLemonSqueezy();
  if (error) {
    console.error(error);
    return null;
  }

  const { data } = await getSubscription(subscriptionId);
  if (!data?.data?.attributes?.urls?.customer_portal_update_subscription) {
    return null;
  }
  return data?.data?.attributes.urls.customer_portal_update_subscription;
}

export async function getProductVariant(variantId) {
  const { error } = await configureLemonSqueezy();
  if (error) {
    console.error(error);
    return null;
  }
  const variant = await getVariant(variantId);
  return variant?.data?.data;
}
