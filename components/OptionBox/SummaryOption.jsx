"use client";

import SelectBox from "@/components/SelectBox";
import { summary_options } from "@/lib/summary_options";
import { useState } from "react";
import calculateCost from "@/lib/calculateCost";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  update_gems,
  add_summary_to_local_storage_by_video_id,
  delete_summary,
} from "@/lib/local_storage_handlers";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { languages } from "@/lib/languages";

const SummaryOption = ({ videoData, setVideoData, session, setLoading }) => {
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

  function getLanguageNameByCode(value) {
    if (!value) return "Unknown";
    const lang = languages.find(
      (l) => l.value.toLowerCase() === value.toLowerCase()
    );
    return lang ? lang.label : "Unknown";
  }

  const handleTranslate = async () => {
    if (!session) {
      toast.error("Please login to continue the process.");
      return;
    }

    // Nếu summary cùng loại option đã tồn tại thì không tạo lại
    if (
      videoData.summaries &&
      videoData.summaries.find(
        (sum) => sum.option === summaryOption && sum.language === targetLanguage
      )
    ) {
      toast.error(
        `Summary with "${summaryOption}" option and language "${getLanguageNameByCode(
          targetLanguage
        )}" already exists! Please choose another type or edit the existing one.`
      );
      return;
    }

    setIsProcessing(true);
    setLoading(true);
    const res = await fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _id: videoData._id,
        userId: session.user.id,
        cost: videoCost,
        option: summaryOption,
        targetLanguage,
        transcript: videoData.transcript,
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
        summaryOption,
        targetLanguage
      );
      toast.success("Summary successfully generated!");
      router.push(`/main/summary/${videoData._id}?summaryId=${data.summaryId}`);
    }
    setIsProcessing(false);
    setLoading(false);
  };

  async function handleDeleteSummary(summaryId) {
    try {
      const res = await fetch("/api/delete_summary", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ summaryId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to delete summary");
        throw new Error(data.message || "Failed to delete summary");
      }

      setVideoData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          summaries: prev.summaries.filter((s) => s._id !== summaryId),
        };
      });

      delete_summary(videoData._id, summaryId);

      toast.success("Summary deleted successfully!");
      return data.message;
    } catch (error) {
      console.error("Delete summary error:", error);
      toast.error("Error deleting summary");
      throw error;
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center max-h-[60vh] justify-between">
      <div className="w-full max-w-md border border-gray-300 rounded-xl p-4 bg-white shadow-sm">
        <h3 className="font-semibold text-center mb-2">Generated Summaries</h3>
        <div className="w-full overflow-y-auto space-y-2 flex flex-col max-h-[80px]">
          {videoData?.summaries && videoData.summaries.length > 0 ? (
            videoData.summaries.map((sum, index) => (
              <div
                key={index}
                className="flex gap-2 items-center justify-between"
              >
                <Link
                  href={`/main/summary/${videoData._id}?summaryId=${sum._id}`}
                  className="text-sm w-full bg-gray-100 rounded-lg px-3 py-2 flex flex-col gap-1 hover:bg-gray-200 transition-colors"
                >
                  <span className="font-medium">
                    {sum.summary?.title || "Untitled Summary"}
                  </span>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500">
                      ({sum.option})
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {getLanguageNameByCode(sum.language)}
                    </span>
                  </div>
                </Link>
                <div
                  onClick={() => handleDeleteSummary(sum._id)}
                  className="bg-smoke hover:bg-light-gray p-2 rounded-full"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </div>
              </div>
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
