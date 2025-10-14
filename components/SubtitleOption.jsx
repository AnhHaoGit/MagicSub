"use client";

import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { languages } from "@/lib/languages";
import { source_languages } from "@/lib/source_languages";
import { toast } from "react-toastify";
import { useState } from "react";
import calculateCost from "@/lib/calculateCost";
import { useRouter } from "next/navigation";
import SelectBox from "@/components/SelectBox";

import {
  add_subtitle_to_local_storage_by_video_id,
  update_gems,
} from "@/lib/local_storage_handlers";
import Link from "next/link";

const SubtitleOption = ({ videoData, session, setLoading }) => {
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
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
    setLoading(true);
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cloudUrl: videoData.cloudUrl,
        _id: videoData._id,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        userId: session.user.id,
        duration: videoData.duration,
        cost: videoCost,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message);
      setIsProcessing(false);
      setLoading(false);
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
    setLoading(false);
  };

  function getLanguageNameByCode(value) {
    if (!value) return "Unknown";
    const lang = languages.find(
      (l) => l.value.toLowerCase() === value.toLowerCase()
    );
    return lang ? lang.label : "Unknown";
  }

  return (
    <div className="w-full h-full flex flex-col items-center max-h-[60vh] justify-between">
      <div className="w-full max-w-md border border-gray-300 rounded-xl p-4 bg-white shadow-sm">
        <h3 className="font-semibold text-center mb-2">Generated Subtitles</h3>
        <div className="w-full overflow-y-auto space-y-2 flex flex-col max-h-[80px]">
          {videoData?.subtitles && videoData.subtitles.length > 0 ? (
            videoData.subtitles.map((sub, index) => (
              <Link
                href={`/main/custom_subtitle/${videoData._id}?subtitleId=${sub._id}`}
                key={index}
                className="text-sm w-full bg-gray-100 rounded-lg px-3 py-2 hover:bg-gray-200 transition-colors"
              >
                <span className="font-medium">
                  {getLanguageNameByCode(sub.language)}
                </span>{" "}
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center">
              No subtitles generated yet
            </p>
          )}
        </div>
      </div>

      <div className="w-full flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-1 w-full">
          <SelectBox
            options={source_languages}
            label="Source Language"
            value={sourceLanguage}
            onValueChange={handleSourceLanguageChange}
            placeholder="Select Source Language"
          />
          <p className="gray text-[10px]">
            Choose source language for more accurate transcription
          </p>
        </div>

        <SelectBox
          options={languages}
          label="Target Language"
          value={targetLanguage}
          onValueChange={handleTargetLanguageChange}
          placeholder="Select Target Language"
        />
      </div>

      <div className="flex flex-col justify-between items-center gap-3 mt-6">
        <button
          className="flex items-center gap-2 bg-iris text-white rounded-full py-2 px-8 md:py-3 md:px-15 shadow-xl font-semibold justify-center hover:bg-violet transition-colors cursor-pointer text-xs md:text-sm"
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
    </div>
  );
};

export default SubtitleOption;
