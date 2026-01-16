"use client";

import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { languages } from "@/lib/languages";
import { toast } from "react-toastify";
import { useState } from "react";
import calculateCost from "@/lib/calculateCost";
import { useRouter } from "next/navigation";
import SelectBox from "@/components/SelectBox";

import {
  add_subtitle_to_local_storage_by_video_id,
  delete_subtitle,
  update_gems,
} from "@/lib/local_storage_handlers";
import Link from "next/link";

const SubtitleOption = ({
  videoData,
  setVideoData,
  session,
  setLoading,
  endpoints,
}) => {
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const videoCost = videoData
    ? calculateCost(videoData.size, videoData.duration)
    : 0;

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

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: videoData._id,
          targetLanguage,
          userId: session.user.id,
          duration: videoData.duration,
          cost: videoCost,
          transcript: videoData.transcript,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Error during translation.");
      } else {
        add_subtitle_to_local_storage_by_video_id(
          videoData._id,
          data.subtitle,
          data.subtitleId,
          data.language,
        );
        update_gems(videoCost);
        toast.success("Subtitle successfully generated!");
        router.push(
          `/main/custom_subtitle/${videoData._id}?subtitleId=${data.subtitleId}`
        );
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again later.");
      console.error(err);
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  function getLanguageNameByCode(value) {
    if (!value) return "Unknown";
    const lang = languages.find(
      (l) => l.value.toLowerCase() === value.toLowerCase()
    );
    return lang ? lang.label : "Unknown";
  }

  async function handleDeleteSubtitle(subtitleId) {
    try {
      const res = await fetch("/api/delete_subtitle", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subtitleId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to delete subtitle");
        throw new Error(data.message || "Failed to delete subtitle");
      }

      setVideoData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          subtitles: prev.subtitles.filter((s) => s._id !== subtitleId),
        };
      });

      delete_subtitle(videoData._id, subtitleId);

      toast.success("Subtitle deleted successfully!");
      return data.message;
    } catch (error) {
      console.error("Delete subtitle error:", error);
      toast.error("Error deleting subtitle");
      throw error;
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center max-h-[60vh] justify-between">
      <div className="w-full max-w-md border border-gray-300 rounded-xl p-4 bg-white shadow-sm">
        <h3 className="font-semibold text-center mb-2">Generated Subtitles</h3>
        <div className="w-full overflow-y-auto space-y-2 flex flex-col max-h-[80px]">
          {videoData?.subtitles && videoData.subtitles.length > 0 ? (
            videoData.subtitles.map((sub, index) => (
              <div
                key={index}
                className="flex gap-2 items-center justify-between"
              >
                <Link
                  href={`/main/custom_subtitle/${videoData._id}?subtitleId=${sub._id}`}
                  className="text-sm w-full bg-gray-100 rounded-lg px-3 py-2 hover:bg-gray-200 transition-colors"
                >
                  <span className="font-medium">
                    {getLanguageNameByCode(sub.language)}
                  </span>{" "}
                </Link>
                <div
                  onClick={() => handleDeleteSubtitle(sub._id)}
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
              No subtitles generated yet
            </p>
          )}
        </div>
      </div>

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

export default SubtitleOption;
