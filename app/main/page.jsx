"use client";

import React, { useEffect, useState } from "react";
import MainNavbar from "@/components/MainNavbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import { add_video_to_local_storage } from "@/lib/local_storage_handlers";

const MainPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  

  return (
    <>
      <MainNavbar />
      <main className="flex flex-col items-center justify-center h-screen">
        <div className="flex flex-col items-center w-2/3 justify-center mt-10 bg-smoke p-10 gap-10 rounded-4xl shadow-lg">
          <div className="text-center">
            <p className="font-bold text-2xl">Upload your media</p>
            <p>
              (or check your{" "}
              <Link href="/history" className="iris">
                history
              </Link>{" "}
              to see your uploaded videos)
            </p>
          </div>

          
          <button className="flex items-center gap-2 bg-iris text-white rounded-full py-4 px-20 shadow-2xl mt-10 font-bold justify-center hover:bg-violet transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
            Upload your Video
            {loading && <span className="ml-2">Downloading...</span>}
          </button>
        </div>
      </main>
    </>
  );
};

export default MainPage;
