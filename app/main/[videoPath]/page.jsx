"use client";

import React, { useEffect, useState } from "react";
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
import { languages } from "@/lib/languages";
import { source_languages } from "@/lib/source_languages";

export default function VideoPage() {
  const router = useRouter();
  const { videoPath } = useParams();
  const { data: session, status } = useSession();
  const [videoData, setVideoData] = useState(null);
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [videoCost, setVideoCost] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session) {
      router.push("/login");
    }
  }, [status, router]);

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

  const handleSourceLanguageChange = (value) => {
    setSourceLanguage(value);
  };

  const handleTargetLanguageChange = (value) => {
    setTargetLanguage(value);
  };

  console.log(videoData);

  const handleTranslate = async () => {
    if (!session) {
      toast.error("Please login to continue the process.");
      return;
    }
    if (
      videoData.subtitles &&
      videoData.subtitles.find((sub) => sub.language === targetLanguage)
    ) {
      toast.error(
        `Subtitle in ${targetLanguage} already exists! Please choose another language or edit the existing subtitle in the history page.`
      );
      return;
    }
    // if (userData.gems < videoCost) {
    //   toast.error("Insufficient gems to process video.");
    //   return;
    // }

    setIsProcessing(true);
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cloudUrl: videoData.cloudUrl,
        _id: videoData._id,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        style: session.user.style,
        userId: session.user.id,
        duration: videoData.duration,
        cost: videoCost,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message);
      setIsProcessing(false);
      return;
    } else {
      add_subtitle_to_local_storage_by_video_id(
        videoData._id,
        data.subtitle,
        data.subtitleId,
        data.language
      );
      update_gems(videoCost);
      toast.success("Subtitle successfully generated!");
      router.push(
        `/main/custom_subtitle/${videoData._id}?subtitleId=${data.subtitleId}`
      );
    }
    setIsProcessing(false);
  };

  return (
    <>
      <MainNavbar />
      <main className="flex flex-col items-center w-full min-h-screen p-4 sm:p-6 md:p-10">
        <div className="flex flex-col md:flex-row w-full items-center justify-between gap-8 md:gap-5 mt-20">
          {/* Video player */}
          <div className="w-full md:w-2/3 h-auto md:h-[70vh] bg-black rounded-2xl flex items-center justify-center">
            <video
              src={videoData?.cloudUrl}
              controls
              className="rounded-xl shadow-xl w-full h-full object-contain"
              allowFullScreen
            />
          </div>

          {/* Sidebar settings */}
          <div className="w-full md:w-1/3 h-auto md:h-[70vh] flex flex-col items-center justify-between p-5 bg-smoke rounded-4xl shadow-lg">
            <div className="flex flex-col w-full items-center gap-4">
              <LanguageSelect
                title="Source Language"
                language={sourceLanguage}
                handleLanguageChange={handleSourceLanguageChange}
                languagesList={source_languages}
              />
              <p className="gray text-xs">
                Choose source language for more accurate transcription
              </p>
              <LanguageSelect
                title="Target Language"
                language={targetLanguage}
                handleLanguageChange={handleTargetLanguageChange}
                languagesList={languages}
              />
            </div>
            <div className="flex flex-col justify-between items-center gap-5 mt-6">
              <p className="text-xs text-center">
                You will be charged {videoCost} 💎 for this video
              </p>
              <button
                className="flex items-center gap-2 bg-iris text-white rounded-full py-3 px-10 md:py-4 md:px-20 shadow-2xl font-bold justify-center hover:bg-violet transition-colors cursor-pointer text-sm md:text-base"
                onClick={handleTranslate}
              >
                {isProcessing ? (
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
                      className="size-5 md:size-6"
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
