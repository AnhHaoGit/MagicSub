"use client";

import React, { useRef, useEffect, useState } from "react";
import MainNavbar from "@/components/MainNavbar";
import { useParams } from "next/navigation";
// import VideoTrimmer from "@/components/VideoTrimmer";
// import { formatTime } from "@/lib/format_time";
import LanguageSelect from "@/components/LanguageSelect";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import {
  add_subtitle_to_local_storage_by_video_id,
} from "@/lib/local_storage_handlers";
import { useRouter } from "next/navigation";
import SuggestAFeature from "@/components/SuggestAFeature";

// const STEP = 0.1;

export default function VideoPage() {
  const router = useRouter();
  const { videoPath } = useParams();
  const { data: session } = useSession();
  const [videoData, setVideoData] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [isProccessing, setIsProcessing] = useState(false);

  // const [values, setValues] = useState([0, 0]);
  // const trimmedDuration = formatTime(values[1] - values[0]);

  useEffect(() => {
    const video = JSON.parse(localStorage.getItem("videos")) || [];
    const found = video.find((v) => v._id === videoPath);
    setVideoData(found);
    // setValues([0, found?.duration]);
  }, [videoPath]);

  const handleTargetLanguageChange = (value) => {
    setTargetLanguage(value);
  };


  const videoRef = useRef(null);

  // useEffect(() => {
  //   if (videoRef.current) {
  //     videoRef.current.currentTime = values[0];
  //   }
  // }, [values[0]]);

  const handleProcess = async () => {
    if (!session) {
      toast.error("Please login to continue the process.");
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
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Error processing video:", data);
      setIsProcessing(false);
      return;
    } else {
      add_subtitle_to_local_storage_by_video_id(videoData._id, data.subtitle, data.subtitleId, data.customize);
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

            <button
              className="flex items-center gap-2 bg-iris text-white rounded-full py-4 px-20 shadow-2xl font-bold justify-center hover:bg-violet transition-colors cursor-pointer"
              onClick={handleProcess}
            >
              {isProccessing ? (
                <span>Processing...</span>
              ) : (
                <span>Process</span>
              )}

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
            </button>
          </div>
        </div>

        {/* <div className="flex items-center justify-between w-full mt-10 px-5">
          <div className="flex items-center gap-3">
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
                d="m7.848 8.25 1.536.887M7.848 8.25a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm1.536.887a2.165 2.165 0 0 1 1.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 1 1-5.196 3 3 3 0 0 1 5.196-3Zm1.536-.887a2.165 2.165 0 0 0 1.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863 2.077-1.199m0-3.328a4.323 4.323 0 0 1 2.068-1.379l5.325-1.628a4.5 4.5 0 0 1 2.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0 0 10.607 12m3.736 0 7.794 4.5-.802.215a4.5 4.5 0 0 1-2.48-.043l-5.326-1.629a4.324 4.324 0 0 1-2.068-1.379M14.343 12l-2.882 1.664"
              />
            </svg>

            <h2 className="text-lg font-bold">Trim video</h2>

            <p className="text-sm">(Select the section to process)</p>
          </div>
          <div className="flex items-center gap-2">
            <p>Duration: </p>
            <p>{trimmedDuration}</p>
          </div>
        </div> */}
        {/* <div className="flex flex-col bg-smoke p-6 rounded-4xl shadow-lg w-full mt-3">
          <VideoTrimmer
            STEP={STEP}
            videoData={videoData}
            values={values}
            setValues={setValues}
          />
        </div> */}
        <SuggestAFeature />
      </main>
    </>
  );
}
