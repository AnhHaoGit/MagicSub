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
      <main className="w-full px-6 lg:px-16 py-10 flex flex-col gap-8 items-start pt-28">
        <section className="w-full flex flex-col gap-4 min-h-[250px]">
          <h2 className="text-gray-500 font-medium text-lg">Your uploads</h2>

          {videoData && videoData.length > 0 ? (
            <div className="w-full">
              <div className="flex gap-x-6 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
                {videoData.map((video) => (
                  <HistoryBox
                    key={video._id}
                    video={video}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>

              {videoData.length > 5 && (
                <div className="w-full flex justify-center items-center gap-1 mt-2 animate-pulse">
                  <p className="text-gray-400 text-xs">Swipe to view more</p>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-3 text-gray-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-48 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl">
              <p className="text-gray-400 text-sm">No files uploaded yet</p>
            </div>
          )}
        </section>

        <section className="w-full flex flex-col gap-4 min-h-[250px]">
          <h2 className="text-gray-500 font-medium text-lg">Shared with you</h2>

          {session?.user?.sharings && session.user.sharings.length > 0 ? (
            <div className="w-full">
              <div className="flex gap-x-6 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
                {[...session.user.sharings]
                  .sort(
                    (a, b) =>
                      new Date(b.sharedAt || b.createdAt) -
                      new Date(a.sharedAt || a.createdAt),
                  )
                  .map((video) => (
                    <HistoryBox
                      key={video._id}
                      video={video}
                      isShared={true}
                      onDelete={() => {}}
                    />
                  ))}
              </div>

              {session.user.sharings.length > 5 && (
                <div className="w-full flex justify-center items-center gap-1 mt-2 animate-pulse">
                  <p className="text-gray-400 text-xs">Swipe to view more</p>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-3 text-gray-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-48 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl">
              <p className="text-gray-400 text-sm">
                No videos shared with you yet
              </p>
            </div>
          )}
        </section>

        <SuggestAFeature />
      </main>
    </>
  );
};

export default Page;
