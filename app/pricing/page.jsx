"use client";

import LandingPageNavbar from "@/components/LandingPageNavbar";
import SuggestAFeature from "@/components/SuggestAFeature";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import fetch_data from "@/lib/fetch_data";

export default function Page() {
  const [productsData, setProductsData] = useState([]);
  const { data: session, status } = useSession();
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (session && status === "authenticated") {
      fetch_data(session);
    }
  }, [session, status]);

  const getSubscriptionStatus = (planName) => {
    if (!session?.user?.subscription) {
      return "Select Plan";
    } else {
      if (planName === session.user.subscription.data.attributes.product_name) {
        return "Your Current Plan";
      } else {
        return "Select Plan";
      }
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session) router.push("/login");
  }, [status, router]);

  function sortProducts(products) {
    const order = ["Starter Plan", "Plus Plan", "Pro Plan"];
    return products.sort(
      (a, b) => order.indexOf(a.name) - order.indexOf(b.name)
    );
  }

  useEffect(() => {
    async function fetchProductsData() {
      setIsFetching(true);
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const res = await fetch("/api/fetch_products_data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: user.email,
            userId: user.id,
            embed: false,
          }),
        });
        const data = await res.json();
        setProductsData(sortProducts(data));
        setIsFetching(false);
      } catch (err) {
        console.error("Failed to load checkout URLs:", err);
        setError("Failed to load plans.");
        setIsFetching(false);
      }
    }

    fetchProductsData();
  }, []);

  return (
    <>
      <LandingPageNavbar />
      <main className="max-h-screen px-6 pt-25 py-12">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Pay only for <span className="iris">what you need</span>
          </h1>
          <p className="text-gray-600 mt-3 text-lg">
            Simple pricing. Powerful features.
          </p>
        </section>

        {/* Features list */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6 mt-10">
          {[
            "Automatic language detection",
            "AI-powered subtitle generation for YouTube videos",
            "Support for 99 languages",
            "Fully customizable subtitles",
            "Export in .SRT, .ASS, or .TXT",
            "Video export without watermark",
            "7-day secure video storage",
          ].map((text) => (
            <div
              key={text}
              className="flex items-start gap-3 bg-white shadow-sm rounded-xl p-4 border border-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 iris shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <p className="text-sm text-gray-700">{text}</p>
            </div>
          ))}
        </div>

        {error && (
          <>
            <p>{error}</p>
          </>
        )}

        {isFetching && (
          <div className="flex justify-center items-center py-20 gap-3">
            <p className="text-sm">Fetching all plans</p>
            <Spinner key="ellipsis" variant="ellipsis" />
          </div>
        )}

        {/* Pricing cards */}
        {productsData.length > 0 && !error && (
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mt-20">
            {productsData.map((product) => (
              <PlanCard
                key={product.id}
                product={product}
                status={getSubscriptionStatus(product.name)}
              />
            ))}
          </div>
        )}

        <div className="max-w-6xl mx-auto mt-16">
          <SuggestAFeature />
        </div>
      </main>
    </>
  );
}

/* --- Reusable Plan Card --- */
function PlanCard({ product, status }) {
  const popular = product.name === "Plus Plan";
  const gems =
    product.name === "Starter Plan"
      ? 250
      : product.name === "Plus Plan"
      ? 500
      : 1000;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-xl ${
        popular ? "border-iris shadow-violet-100" : "border-gray-200"
      }`}
    >
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-iris text-white text-xs px-3 py-1 rounded-full shadow">
          Most Popular
        </span>
      )}
      <h3 className="text-xl font-semibold">{product.name}</h3>
      <p className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold">${product.price / 100}</span>
        <span className="text-sm text-gray-500">/month</span>
      </p>

      <ul className="mt-6 space-y-3 text-sm text-gray-700 mb-6">
        <li className="flex items-center gap-2">
          <CheckIcon /> Get {gems} 💎 per month
        </li>
        {popular && (
          <li className="flex items-center gap-2">
            <CheckIcon /> 5% off
          </li>
        )}
      </ul>

      <Link
        href={product.checkoutUrl}
        className={`mt-auto inline-block rounded-lg px-5 py-2 text-center font-medium text-white transition ${
          popular ? "bg-iris hover:bg-violet" : "bg-black hover:bg-gray"
        } ${
          status === "Your Current Plan" ? "pointer-events-none opacity-60" : ""
        }`}
        target={status === "Your Current Plan" ? "_self" : "_blank"}
        rel="noreferrer"
      >
        {status}
      </Link>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 iris"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}
