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

const SummaryOption = ({ videoData, session }) => {
  const [summaryOption, setSummaryOption] = useState("short_summary");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const videoCost = videoData
    ? calculateCost(videoData.size, videoData.duration)
    : 0;

  const handleSummaryOptionChange = (value) => {
    setSummaryOption(value);
  };

  console.log("Selected summary option:", summaryOption);

  const handleTranslate = async () => {
    if (!session) {
      toast.error("Please login to continue the process.");
      return;
    }

    setIsProcessing(true);
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
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message);
      setIsProcessing(false);
      return;
    } else {
      console.log("Summary response data:", data.summary);
      update_gems(videoCost);
      add_summary_to_local_storage_by_video_id(
        videoData._id,
        data.summary,
        data.summaryId
      );
      toast.success("Summary successfully generated!");
      router.push(
        `/main/summary/${videoData._id}?summaryId=${data.summaryId}`
      );
    }
    setIsProcessing(false);
  };

  return (
    <>
      <SelectBox
        options={summary_options}
        label="Summary Options"
        value={summaryOption}
        onValueChange={handleSummaryOptionChange}
        placeholder="Select Summary Type"
      />
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

export default SummaryOption;
