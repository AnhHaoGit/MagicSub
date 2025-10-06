"use client";

import LanguageSelect from "@/components/LanguageSelect";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { languages } from "@/lib/languages";
import { source_languages } from "@/lib/source_languages";
import { toast } from "react-toastify";
import { useState } from "react";
import calculateCost from "@/lib/calculateCost";

import {
  add_subtitle_to_local_storage_by_video_id,
  update_gems,
} from "@/lib/local_storage_handlers";

const SubtitleOption = ({ videoData, session }) => {
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [isProcessing, setIsProcessing] = useState(false);
  const videoCost = videoData
    ? calculateCost(videoData.size, videoData.duration)
    : 0;

  const handleSourceLanguageChange = (value) => {
    setSourceLanguage(value);
  };

  const handleTargetLanguageChange = (value) => {
    setTargetLanguage(value);
  };

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
        <button
          className="flex items-center gap-2 bg-iris text-white rounded-full py-3 px-10 md:py-4 md:px-20 shadow-xl font-bold justify-center hover:bg-violet transition-colors cursor-pointer text-sm md:text-base"
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
        <p className="text-xs text-center">
          You will be charged {videoCost} 💎 for this video
        </p>
      </div>
    </>
  );
};

export default SubtitleOption;
