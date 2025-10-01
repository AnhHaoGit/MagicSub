"use client";

import MainNavbar from "@/components/MainNavbar";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

const Subscription = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const sub = session?.user?.subscription?.data?.attributes || null;

  const gems = sub?.product_name.includes("Starter")
    ? 250
    : sub?.product_name.includes("Plus")
    ? 500
    : sub?.product_name.includes("Pro")
    ? 1000
    : "N/A";

  const popular = sub?.product_name.includes("Plus");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session) router.push("/login");
  }, [status, router, session]);

  const handleCancel = async () => {
    if (!sub) return;
    try {
      setLoading(true);
      const res = await fetch("/api/cancel_subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: session.user.subscription.data.id,
          userId: session.user.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to cancel subscription");
      }

      toast.success("Subscription cancelled!");
      router.refresh();
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <>
      <MainNavbar />
      <main className="pt-28 flex flex-col items-center">
        <h1 className="font-extrabold text-4xl mb-12 text-gray-900">
          Subscription Detail
        </h1>

        {sub ? (
          <div className="flex flex-col gap-8 border rounded-3xl p-10 shadow-2xl w-[480px] bg-white relative">
            {/* Badge popular */}
            {popular && (
              <span className="absolute top-4 right-4 bg-iris text-white text-xs font-semibold px-3 py-1 rounded-full">
                Popular
              </span>
            )}

            {/* Plan name */}
            <p className="text-3xl font-bold text-gray-900 text-center">
              {sub.product_name}
            </p>

            {/* Features */}
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <CheckIcon /> Get {gems} 💎 per month
              </div>
              {popular && (
                <div className="flex items-center gap-2">
                  <CheckIcon /> 5% discount applied
                </div>
              )}
            </div>

            {/* Status & next payment */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
              <p>
                <span className="text-gray-600">Status:</span>{" "}
                <span className="font-semibold text-gray-900">
                  {sub.status_formatted}
                </span>
              </p>
              <p>
                <span className="text-gray-600">Created At:</span>{" "}
                <span className="font-semibold text-gray-900">
                  {formatDate(sub.created_at)}
                </span>{" "}
                <span>(DD/MM/YYYY)</span>
              </p>
              <p>
                <span className="text-gray-600">Next Payment:</span>{" "}
                <span className="font-semibold text-gray-900">
                  {formatDate(sub.renews_at)}
                </span>{" "}
                <span>(DD/MM/YYYY)</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Link
                href="/pricing"
                className="w-full flex justify-center items-center bg-gray-900 text-white font-medium px-5 py-2.5 rounded-lg transition-colors hover:bg-gray-700 text-md"
              >
                Change Plan
              </Link>
              <button
                onClick={handleCancel}
                disabled={loading || sub.status !== "active"}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-medium px-5 py-2.5 rounded-lg transition text-md"
              >
                {loading ? "Cancelling..." : "Cancel Subscription"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-lg text-gray-600">No subscription found.</p>
        )}
      </main>
    </>
  );
};

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 iris"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
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

export default Subscription;
