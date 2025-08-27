"use server";
import {
  createCheckoutUrl,
  createCustomerPortal,
  getAllProducts,
  getFirstVariant,
} from "@/lib/lemon-squeezy/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getSubscriptionId } from "@/lib/supabase/database/subscriptions";
import { getCustomerId } from "@/lib/supabase/database/users";
import { createClient } from "@/lib/supabase/server";

export async function getSubscriptionProducts() {
  const products = await getAllProducts();
  const subscriptionProducts = products.filter((product) =>
    product.attributes.name.startsWith("subscription"),
  );

  const productWithVariant = await Promise.all(
    subscriptionProducts.map(async (product) => {
      const variant = await getFirstVariant(product.id);
      return {
        ...product.attributes,
        variant_id: variant?.id,
      };
    }),
  );

  return productWithVariant;
}

export async function handleCheckout(variantId) {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) {
    return null;
  }

  const checkoutUrl = await createCheckoutUrl({
    variantId,
    userEmail: user?.email,
    userId: user?.id,
  });

  return checkoutUrl;
}

export async function getCustomerPortalUrl() {
  const supabaseClient = await createClient();
  const user = await getCurrentUser(supabaseClient);
  if (!user) {
    return null;
  }
  const customerId = await getCustomerId(supabaseClient, user.id);
  const subscriptionId = await getSubscriptionId(supabaseClient, customerId);
  const url = await createCustomerPortal(subscriptionId);
  console.log(url);
  return url;
}