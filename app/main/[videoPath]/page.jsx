"use client";

import React, { useRef, useEffect, useState } from "react";
import MainNavbar from "@/components/MainNavbar";
import { useParams } from "next/navigation";
import LanguageSelect from "@/components/LanguageSelect";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import {
  add_subtitle_to_local_storage_by_video_id,
  update_gems,
} from "@/lib/local_storage_handlers";
import { useRouter } from "next/navigation";
import calculateCost from "@/lib/calculateCost";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import SuggestAFeature from "@/components/SuggestAFeature";

export default function VideoPage() {
  const router = useRouter();
  const { videoPath } = useParams();
  const { data: session } = useSession();
  const [videoData, setVideoData] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [isProccessing, setIsProcessing] = useState(false);
  const [videoCost, setVideoCost] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const video = JSON.parse(localStorage.getItem("videos")) || [];
    const found = video.find((v) => v._id === videoPath);
    setVideoData(found);
    setVideoCost(calculateCost(found.size, found.duration));
  }, [videoPath]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")) || [];
    setUserData(user);
  }, []);

  const handleTargetLanguageChange = (value) => {
    setTargetLanguage(value);
  };

  const videoRef = useRef(null);

  const handleProcess = async () => {
    if (!session) {
      toast.error("Please login to continue the process.");
      return;
    }
    if (userData.gems < videoCost) {
      toast.error("Insufficient gems to process video.");
      return;
    }

    setIsProcessing(true);
    const res = await fetch("/api/subtitle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cloudUrl: videoData.cloudUrl,
        _id: videoData._id,
        targetLanguage: targetLanguage,
        style: session.user.style,
        userId: session.user.id,
        duration: videoData.duration,
        cost: videoCost,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Error processing video:", data);
      setIsProcessing(false);
      return;
    } else {
      add_subtitle_to_local_storage_by_video_id(
        videoData._id,
        data.subtitle,
        data.subtitleId,
        data.customize
      );
      update_gems(videoCost);
      toast.success("Subtitle successfully generated!");
      router.push(`/main/custom_subtitle/${videoData._id}`);
    }
    setIsProcessing(false);
  };

  return (
    <>
      <MainNavbar />
      <main className="flex flex-col items-center justify-items-start h-screen w-full p-10">
        <div className="flex w-full items-center justify-between gap-5 h-8/10 mt-20">
          <div className="w-2/3 h-full bg-black rounded-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              src={videoData?.cloudUrl}
              controls
              className="rounded-xl shadow-xl w-90% h-full"
              allowFullScreen
            />
          </div>
          <div className="w-1/3 h-full flex flex-col items-center justify-between p-5 bg-smoke rounded-4xl shadow-lg">
            <div className="flex flex-col w-full items-center gap-4">
              <h1 className="font-bold text-[clamp(1rem, 2vw, 1.5rem)] mt-5">
                Add your Subtitle here!
              </h1>
              <LanguageSelect
                targetLanguage={targetLanguage}
                handleTargetLanguageChange={handleTargetLanguageChange}
              />
            </div>
            <div className="flex flex-col justify-between items-center gap-5">
              <p className="text-xs">
                You will be charged {videoCost} 💎 for this video
              </p>

              <button
                className="flex items-center gap-2 bg-iris text-white rounded-full py-4 px-20 shadow-2xl font-bold justify-center hover:bg-violet transition-colors cursor-pointer"
                onClick={handleProcess}
              >
                {isProccessing ? (
                  <>
                    <span>Processing</span>
                    <Spinner key="ellipsis" variant="ellipsis" />
                  </>
                ) : (
                  <>
                    <span>Process</span>
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
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <SuggestAFeature />
      </main>
    </>
  );
}
