"use client";

import MainNavbar from "@/components/MainNavbar";
import { useState, useEffect } from "react";
import HistoryBox from "@/components/HistoryBox";
import SuggestAFeature from "@/components/SuggestAFeature";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const Page = () => {
  const [videoData, setVideoData] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session) {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const videos = JSON.parse(localStorage.getItem("videos")) || [];
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoData.map((video) => (
              <HistoryBox
                key={video._id}
                video={video}
                onDelete={handleDeleteClick}
              />
            ))}
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
