"use client";

import React, { useRef, useEffect, useState } from "react";
import MainNavbar from "@/components/MainNavbar";
// import { useParams } from "next/navigation";
// import { useVideo } from "@/contexts/VideoContext";
import VideoTrimmer from "@/components/VideoTrimmer";
import { formatTime } from "@/lib/format_time";
import LanguageSelect from "@/components/LanguageSelect";

export default function VideoPage() {
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [isProccessing, setIsProcessing] = useState(false);

  const handleSourceLanguageChange = (value) => {
    setSourceLanguage(value);
  };

  const handleTargetLanguageChange = (value) => {
    setTargetLanguage(value);
  };

  console.log("Source Language:", sourceLanguage);
  console.log("Target Language:", targetLanguage);

  const videoUrl =
    "https://res.cloudinary.com/dtmt08iwk/video/upload/v1752377192/youtube_downloads/yt_1752377185910.mp4";
  const STEP = 0.1;
  const duration = 344.444807;

  const videoRef = useRef(null);

  const [values, setValues] = useState([0, duration]);

  let trimmedDuration = formatTime(values[1] - values[0]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = values[0];
    }
  }, [values[0]]);

  const handleProcess = async () => {
    setIsProcessing(true);
    const res = await fetch("/api/subtitle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoUrl: videoUrl,
        targetLanguage: 'vi'
      }),
    });

    const data = await res.json();
    console.log(data.originalSrt);
    console.log(data.translatedSrt);
    setIsProcessing(false);
  };

  // const [currentVideo, setCurrentVideo] = useState(null);
  // const { videoPath } = useParams();
  // const { video } = useVideo();

  // useEffect(() => {
  //   const currentVideo = video.find((video) => video.publicId === videoPath);
  //   setCurrentVideo(currentVideo);
  // }, [video, videoPath]);

  return (
    <>
      <MainNavbar />
      <main className="flex flex-col items-center justify-items-start h-screen w-full p-10">
        <div className="flex items-center justify-items-start w-full">
          <h1 className="mt-20 font-bold text-2xl">Video Preview</h1>
        </div>
        <div className="flex w-full mt-5 items-center justify-between gap-5">
          <div className="w-2/3">
            {/* {currentVideo?.cloudUrl ? (
            <video
              src={currentVideo.cloudUrl}
              controls
              className="w-[1000px] rounded shadow-lg"
            />
          ) : (
            <p>Loading video...</p>
          )} */}

            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="rounded-xl shadow-xl w-full"
            />
          </div>
          <div className="w-1/3 h-full flex flex-col items-center justify-items-first px-5 bg-smoke rounded-4xl shadow-lg">
            <h1 className="font-bold text-[clamp(1rem, 2vw, 1.5rem)] mt-5">
              Add your Subtitle here!
            </h1>
            <LanguageSelect
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              handleSourceLanguageChange={handleSourceLanguageChange}
              handleTargetLanguageChange={handleTargetLanguageChange}
            />

            <button
              className="flex items-center gap-2 bg-iris text-white rounded-full py-4 px-20 shadow-2xl mt-30 font-bold justify-center hover:bg-violet transition-colors cursor-pointer"
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

        <div className="flex items-center justify-between w-full mt-10 px-5">
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
        </div>
        <div className="flex flex-col bg-smoke p-6 rounded-4xl shadow-lg w-full mt-3">
          <VideoTrimmer
            STEP={STEP}
            duration={duration}
            values={values}
            setValues={setValues}
          />
        </div>
      </main>
    </>
  );
}
