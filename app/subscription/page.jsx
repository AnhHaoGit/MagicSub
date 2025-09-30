"use client";

import MainNavbar from "@/components/MainNavbar";
import React from "react";
import { useState } from "react";

const Subscription = () => {
  const [fetchedData, setFetchedData] = useState(null);

  const getSubscriptionData = async () => {
    const res = await fetch("/api/get_subscription_data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription_id: 1522180,
      }),
    });

    const data = await res.json();

    setFetchedData(data);
  };

  console.log(fetchedData);
  return (
    <>
      <MainNavbar></MainNavbar>
      <main className="pt-30 flex flex-col items-center justify-center gap-10">
        <div className="font-extrabold text-4xl">Subscription Detail</div>
        <button
          onClick={getSubscriptionData}
          className="bg-black text-sm px-5 py-2 text-white rounded-3xl hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Get Subscription Data
        </button>
      </main>
    </>
  );
};

export default Subscription;
