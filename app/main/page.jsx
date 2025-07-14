"use client";

import React, { useEffect, useState } from "react";
import MainNavbar from "@/components/MainNavbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useVideo } from "@/contexts/VideoContext";
import Link from "next/link";

const MainPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const { addVideo } = useVideo();


  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleSubmit = async (e) => {
    if (!session) {
      toast.error("Please login to download videos");
      return;
    }
    e.preventDefault();
    setLoading(true);
    const response = await fetch("/api/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    console.log(response);

    if (response.ok) {
      addVideo(data.video);
      router.push(`/main/${data.video.publicId}`);

      console.log(data);
    } else {
      toast.error(data.message || "Download failed"); //handle sau
    }

    setLoading(false);
  };

  return (
    <>
      <MainNavbar />
      <main className="flex flex-col items-center justify-center h-screen">
        <h1 className="font-bold text-4xl">
          You have not uploaded any videos yet.
        </h1>
        <div className="flex flex-col items-center w-2/3 justify-center mt-10 bg-smoke p-10 rounded-4xl shadow-lg">
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

          <div className="flex items-center justify-between w-11/12 gap-6 mt-20 px-3 py-2 rounded-full shadow-[0_0_30px_rgba(76,59,207,0.3)] bg-white">
            <input
              type="text"
              placeholder="Enter YouTube video URL"
              className="ml-2 w-11/12 bg-transparent border-none outline-none text-black"
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              className="bg-iris text-white rounded-full p-4 shadow-md flex items-center justify-center hover:bg-violet transition-colors"
              onClick={handleSubmit}
            >
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
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </button>
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
