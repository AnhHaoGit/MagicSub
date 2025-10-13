"use client";

import SelectBox from "@/components/SelectBox";
import { summary_options } from "@/lib/summary_options";
import { useState } from "react";
import calculateCost from "@/lib/calculateCost";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  update_gems,
  add_summary_to_local_storage_by_video_id,
} from "@/lib/local_storage_handlers";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { languages } from "@/lib/languages";

const SummaryOption = ({ videoData, session, setLoading }) => {
  const [summaryOption, setSummaryOption] = useState("short_summary");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const [targetLanguage, setTargetLanguage] = useState("en");

  const videoCost = videoData
    ? calculateCost(videoData.size, videoData.duration)
    : 0;

  const handleSummaryOptionChange = (value) => {
    setSummaryOption(value);
  };

  const handleTargetLanguageChange = (value) => {
    setTargetLanguage(value);
  };

  const handleTranslate = async () => {
    if (!session) {
      toast.error("Please login to continue the process.");
      return;
    }

    // Nếu summary cùng loại option đã tồn tại thì không tạo lại
    if (
      videoData.summaries &&
      videoData.summaries.find((sum) => sum.option === summaryOption)
    ) {
      toast.error(
        `Summary with "${summaryOption}" option already exists! Please choose another type or edit the existing one.`
      );
      return;
    }

    setIsProcessing(true);
    setLoading(true);
    const res = await fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cloudUrl: videoData.cloudUrl,
        _id: videoData._id,
        style: session.user.style,
        userId: session.user.id,
        duration: videoData.duration,
        cost: videoCost,
        option: summaryOption,
        targetLanguage,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message);
      setIsProcessing(false);
      setLoading(false);
      return;
    } else {
      update_gems(videoCost);
      add_summary_to_local_storage_by_video_id(
        videoData._id,
        data.summary,
        data.summaryId,
        summaryOption
      );
      toast.success("Summary successfully generated!");
      router.push(`/main/summary/${videoData._id}?summaryId=${data.summaryId}`);
    }
    setIsProcessing(false);
    setLoading(false);
  };

  return (
    <div className="w-full h-full flex flex-col items-center max-h-[60vh] justify-between">
      <div className="w-full max-w-md border border-gray-300 rounded-xl p-4 bg-white shadow-sm">
        <h3 className="font-semibold text-center mb-2">Generated Summaries</h3>
        <div className="w-full overflow-y-auto space-y-2 flex flex-col max-h-[80px]">
          {videoData?.summaries && videoData.summaries.length > 0 ? (
            videoData.summaries.map((sum, index) => (
              <Link
                href={`/main/summary/${videoData._id}?summaryId=${sum._id}`}
                key={index}
                className="text-sm w-full bg-gray-100 rounded-lg px-3 py-2 hover:bg-gray-200 transition-colors"
              >
                <span className="font-medium">
                  {sum.summary?.title || "Untitled Summary"}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({sum.option})
                </span>
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center">
              No summaries generated yet
            </p>
          )}
        </div>
      </div>

      <SelectBox
        options={summary_options}
        label="Summary Options"
        value={summaryOption}
        onValueChange={handleSummaryOptionChange}
        placeholder="Select Summary Type"
      />

      <SelectBox
        options={languages}
        label="Target Language"
        value={targetLanguage}
        onValueChange={handleTargetLanguageChange}
        placeholder="Select Target Language"
      />

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

export default SummaryOption;
