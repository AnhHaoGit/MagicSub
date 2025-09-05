"use client";

import MainNavbar from "@/components/MainNavbar";
import { useState, useEffect } from "react";
import HistoryBox from "@/components/HistoryBox";
import SuggestAFeature from "@/components/SuggestAFeature";
import HardSubbedBox from "@/components/HardSubbedBox";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const Page = () => {
  const [videoData, setVideoData] = useState(null);
  const [hardSubbedData, setHardSubbedData] = useState(null);
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

  useEffect(() => {
    let hardSubbedVideo = [];
    for (let video of videoData || []) {
      if (video.cloudUrls && video.cloudUrls.length > 0) {
        for (let url of video.cloudUrls) {
          const newEntry = {
            videoId: video._id,
            id: url.id,
            title: video.title,
            duration: video.duration,
            thumbnailUrl: video.thumbnailUrl,
            url: url.url,
            createdAt: url.createdAt,
          };
          hardSubbedVideo.push(newEntry);
        }
      }
    }

    setHardSubbedData(hardSubbedVideo);
  }, [videoData]);

  return (
    <>
      <MainNavbar />
      <main className="mt-25 w-full px-2 sm:px-4 lg:px-10 flex flex-col lg:flex-row justify-between items-center gap-6 lg:gap-10">
        <div className="w-full lg:w-1/2 flex flex-col items-center">
          <p className="font-bold text-2xl sm:text-3xl">History</p>
          <div className="sm:mt-10 gap-5 flex flex-col w-full max-w-2xl">
            {videoData &&
              videoData.map((video) => (
                <HistoryBox key={video._id} video={video} />
              ))}
            {!videoData ||
              (videoData.length === 0 && (
                <p className="text-gray-500">No files uploaded yet</p>
              ))}
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col items-center">
          <p className="font-bold text-2xl sm:text-3xl">Hard-subbed video</p>
          <div className="mt-6 sm:mt-10 gap-5 flex flex-col w-full max-w-2xl">
            {hardSubbedData &&
              hardSubbedData.map((data) => (
                <HardSubbedBox key={data.id} data={data} />
              ))}
            {!hardSubbedData ||
              (hardSubbedData.length === 0 && (
                <p className="text-gray-500">No hard-subbed video yet</p>
              ))}
          </div>
        </div>

        <SuggestAFeature />
      </main>
    </>
  );
};

export default Page;
