"use client";

import LandingPageNavbar from "@/components/LandingPageNavbar";
import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

const Page = () => {
  const [products, setProducts] = useState([]);
  const [checkoutUrls, setCheckoutUrls] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/fetch_products"); // gọi API route
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to load products:", err);
      }
    };

    fetchProducts();
  }, []);

  console.log(products);

  useEffect(() => {
    const fetchCheckoutUrls = async () => {
      try {
        const res = await fetch("/api/fetch_checkout_url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            variantId: 971516,
            userEmail: "nguyenanhhao090708@gmail.com",
            userId: "688c8e8abd2be107868180dd",
            embed: false,
          }),
        }); // gọi API route
        const data = await res.json();
        setCheckoutUrls(data);
      } catch (err) {
        console.error("Failed to load checkout URLs:", err);
      }
    };

    fetchCheckoutUrls();
  }, []);

  console.log(checkoutUrls);

  return (
    <>
      <LandingPageNavbar />
      <main className="p-10 h-screen flex flex-col items-center justify-items-start">
        <p className="font-bold text-4xl mt-15">
          Pay only for <span className="inline iris">what you need</span>
        </p>
        <div className="flex w-full p-3 items-center justify-evenly mt-4 h-full">
          <div className="border-light-gray rounded-xl p-5 flex flex-col gap-5 shadow-xl h-4/5">
            <p className="font-bold text-2xl">Applied to all plans</p>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="iris size-6 ml-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <p className="text-sm">Automatic language detection</p>
            </div>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="iris size-6 ml-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <p className="text-sm">
                AI-powered subtitle generation for YouTube videos
              </p>
            </div>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="iris size-6 ml-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <p className="text-sm">Support for 99 languages</p>
            </div>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="iris size-6 ml-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <p className="text-sm">Fully customizable subtitles</p>
            </div>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="iris size-6 ml-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <p className="text-sm">Export in .SRT, .ASS, or .TXT</p>
            </div>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="iris size-6 ml-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <p className="text-sm">Video export without watermark</p>
            </div>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="iris size-6 ml-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <p className="text-sm">7-day secure video storage</p>
            </div>
          </div>
          <div className="border-iris flex flex-col items-center justify-between p-6 rounded-xl w-1/4 h-6/7 shadow-[0_0_30px_rgba(76,59,207,0.3)]">
            <div className="flex flex-col gap-3 w-full">
              <div className="flex w-full items-center justify-between">
                <h3 className="text-xl font-semibold flex gap-2">Plus Plan</h3>
                <p className="text-[10px] bg-smoke black rounded-sm py-1 px-2">
                  Most Popular
                </p>
              </div>

              <div className="flex mt-3 gap-3 items-center">
                <p className="gray line-through text-xs">$16</p>
                <p className="text-5xl font-bold">$15</p>
                <div className="text-xs gray">
                  <p>per user</p>
                  <p>per month</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6 text-xs gray">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="iris size-6 ml-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <p className="text-sm">Get 500 💎 per month</p>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs gray">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="iris size-6 ml-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <p className="text-sm">5% off</p>
              </div>
            </div>

            <button className="bg-iris hover:bg-violet text-sm text-white py-2 transition px-4 rounded-xl w-full">
              Select Plan
            </button>
          </div>
          <div className="flex flex-col items-center justify-between h-4/5 w-1/4">
            <div className="border-light-gray p-5 rounded-xl w-full shadow-xl">
              <h3 className="text-lg font-semibold flex gap-2">Starter Plan</h3>
              <div className="flex mt-3 gap-3 items-center">
                <p className="text-2xl font-bold">$8</p>
                <div className="text-[10px] gray">for</div>
                <p className="text-2xl font-bold">250 💎</p>
                <div className="text-[10px] gray">
                  <p>per user</p>
                  <p>per month</p>
                </div>
              </div>

              <Link
                href="https://magicsub.lemonsqueezy.com/buy/24a358c9-f04f-4138-9635-e38bff3b5a08"
                className="mt-10 bg-black white hover:bg-gray transition text-xs py-2 px-4 rounded-xl w-full"
              >
                Select Plan
              </Link>
            </div>
            <div className="border-light-gray p-5 rounded-xl w-full shadow-xl">
              <h3 className="text-lg font-semibold flex gap-2">Pro Plan</h3>
              <div className="flex mt-3 gap-3 items-center">
                <p className="text-2xl font-bold">$32</p>
                <div className="text-[10px] gray">for</div>
                <p className="text-2xl font-bold">1000 💎</p>
                <div className="text-[10px] gray">
                  <p>per user</p>
                  <p>per month</p>
                </div>
              </div>

              <Link
                href="https://magicsub.lemonsqueezy.com/buy/24a358c9-f04f-4138-9635-e38bff3b5a08"
                className="mt-10 bg-black white hover:bg-gray transition text-xs py-2 px-4 rounded-xl w-full"
              >
                Select Plan
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;
