"use client";

import MainNavbar from "@/components/MainNavbar";
import { useState, useEffect } from "react";
import HistoryBox from "@/components/HistoryBox";
import SuggestAFeature from "@/components/SuggestAFeature";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import fetch_data from "@/lib/fetch_data";

const Page = () => {
  const [videoData, setVideoData] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session && status === "authenticated") {
      fetch_data(session);
    }
  }, [session, status]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session) {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const videos = JSON.parse(localStorage.getItem("videos")) || [];
    videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // newest first
    setVideoData(videos);
  }, []);

  const handleDeleteClick = async (videoId, userId) => {
    try {
      const res = await fetch("/api/delete_video", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          videoId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to delete video.");
        return;
      }

      setVideoData((prev) => {
        const updated = prev.filter((v) => v._id !== videoId);
        localStorage.setItem("videos", JSON.stringify(updated));
        return updated;
      });

      toast.success("Video deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while deleting the video.");
    }
  };

  return (
    <>
      <MainNavbar />
      <main className="w-full px-4 lg:px-10 py-10 flex flex-col lg:flex-row gap-10 justify-between items-start pt-25">
        {videoData && videoData.length > 0 ? (
          <div className="flex flex-col justify-between items-start py-2 gap-4">
            <p className="text-gray-500 text-center text-lg">Your uploads</p>
            <div className="flex gap-x-6 overflow-x-auto snap-x snap-mandatory pb-1 hide-scrollbar">
              {videoData.map((video) => (
                <HistoryBox
                  key={video._id}
                  video={video}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
            <div className="w-full flex justify-center items-center gap-1 mt-5">
              <p className="text-gray-500 text-center text-xs">
                Swipe to view all
              </p>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-3 text-gray-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center text-lg">
            No files uploaded yet
          </p>
        )}

        <SuggestAFeature />
      </main>
    </>
  );
};

export default Page;
