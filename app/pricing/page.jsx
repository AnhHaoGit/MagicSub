"use client";

import LandingPageNavbar from "@/components/LandingPageNavbar";
import SuggestAFeature from "@/components/SuggestAFeature";
import Link from "next/link";
import { useState, useEffect } from "react";

const Page = () => {
  const [productsData, setProductsData] = useState([]);
  const [customerPortalUrl, setCustomerPortalUrl] = useState("");

  function sortProducts(products) {
    const order = ["Starter Plan", "Plus Plan", "Pro Plan"]; // thứ tự mong muốn

    return products.sort((a, b) => {
      const indexA = order.indexOf(a.name);
      const indexB = order.indexOf(b.name);
      return indexA - indexB;
    });
  }

  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const res = await fetch("/api/fetch_products_data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userEmail: JSON.parse(localStorage.getItem("user")).email,
            userId: JSON.parse(localStorage.getItem("user")).id,
            embed: false,
          }),
        });
        const data = await res.json();
        const sorted = sortProducts(data);

        setProductsData(sorted);
      } catch (err) {
        console.error("Failed to load checkout URLs:", err);
      }
    };

    fetchProductsData();
  }, []);


  useEffect(() => {
    const fetchCustomerPortal = async () => {
      try {
        const res = await fetch("/api/create_customer_portal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription_id: 1448037,
          }),
        });
        const data = await res.json();

        setCustomerPortalUrl(data.portal_url);
      } catch (err) {
        console.error("Failed to load checkout URLs:", err);
      }
    };

    fetchCustomerPortal();
  }, []);

  return (
    <>
      <LandingPageNavbar />
      <main className="p-10 h-screen w-full flex flex-col items-center justify-items-start">
        <p className="font-bold text-3xl mt-15">
          Pay only for <span className="inline iris">what you need</span>
        </p>
        <div className="flex w-full p-3 items-center gap-5 mt-4 h-full">
          <div className="border-light-gray rounded-xl w-2/5 p-5 flex flex-col gap-5 shadow-xl h-full">
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
          <div className="flex flex-col h-full gap-5 w-3/5">
            {productsData.map((product) => {
              if (product.name === "Plus Plan") {
                return (
                  <div
                    key={product.id}
                    className="border-iris flex items-center w-full justify-between rounded-xl h-full shadow-[0_0_30px_rgba(76,59,207,0.3)] "
                  >
                    <div className="border-r-[1px] border-r-gray-300 h-full w-3/10 rounded-l-2xl p-3">
                      <div className="flex justify-between w-full">
                        <p className="font-semibold">{product.name}</p>
                        <p className="bg-smoke text-[10px] flex justify-center items-center px-2 rounded-lg">
                          Most Popular
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-6 ml-3">
                        <p className="line-through text-[10px] gray">$16</p>
                        <p className="font-bold text-5xl">
                          ${product.price / 100}
                        </p>
                        <div className="text-[10px] gray">
                          <p>per user</p>
                          <p>per month</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-7/10 flex h-full">
                      <div className="w-7/10 flex justify-center gap-2 flex-col">
                        <div className="flex text-xs gray items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="iris size-5 ml-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                          </svg>
                          <p>Get 500 💎 per month</p>
                        </div>
                        <div className="flex text-xs gray items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="iris size-5 ml-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                          </svg>
                          <p>5% off</p>
                        </div>
                      </div>
                      <div className="w-3/10 flex items-center h-full">
                        <Link
                          href={product.checkoutUrl}
                          className="bg-iris hover:bg-violet transition white text-xs px-6 py-2 rounded-lg"
                        >
                          Select Plan
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div
                    key={product.id}
                    className="border-light-gray flex items-center w-full justify-between rounded-xl h-full shadow-lg "
                  >
                    <div className="border-r-[1px] border-r-gray-300 h-full w-3/10 rounded-l-2xl p-3">
                      <p className="font-semibold">{product.name}</p>
                      <div className="flex items-center gap-2 mt-6 ml-3">
                        <p className="font-bold text-5xl">
                          ${product.price / 100}
                        </p>
                        <div className="text-[10px] gray">
                          <p>per user</p>
                          <p>per month</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-7/10 flex h-full">
                      <div className="w-7/10 flex items-center">
                        <div className="flex text-xs gray items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="iris size-5 ml-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                          </svg>
                          <p>
                            Get{" "}
                            {product.name === "Starter Plan" ? "250" : "1000"}{" "}
                            💎 per month
                          </p>
                        </div>
                      </div>
                      <div className="w-3/10 flex items-center h-full">
                        <Link
                          href={product.checkoutUrl}
                          className="bg-black hover:bg-gray transition white text-xs px-6 py-2 rounded-lg"
                        >
                          Select Plan
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
        <SuggestAFeature />
      </main>
    </>
  );
};

export default Page;
