"use client";

import React, { useEffect, useState } from "react";
import MainNavbar from "@/components/MainNavbar";
import { useParams } from "next/navigation";
import { useVideo } from "@/contexts/VideoContext";

export default function VideoPage() {
  const [language, setLanguage] = useState("en");

  const handleChange = (e) => {
    const selected = e.target.value;
    setLanguage(selected);
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
              src="https://res.cloudinary.com/dtmt08iwk/video/upload/v1752377255/youtube_downloads/yt_1752377249979.mp4"
              controls
              className="w-[1000px] rounded-xl shadow-lg"
            />
          </div>
          <div className="w-1/3 h-full flex flex-col items-center justify-items-first px-5 bg-smoke rounded-4xl shadow-lg">
            <h1 className="font-bold text-[clamp(1rem, 2vw, 1.5rem)] mt-5">
              Add your Subtitle here!
            </h1>
            <div className="w-full flex flex-col items-start justify-items-start mt-10">
              <span className="text-xs">Source Language</span>
              <select
                id="language"
                value={language}
                onChange={handleChange}
                className="p-3 bg-white rounded-lg shadow-md mt-2 w-full"
              >
                <option value="en">🇺🇸 English</option>
                <option value="vi">🇻🇳 Tiếng Việt</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="ja">🇯🇵 日本語</option>
                <option value="es">🇪🇸 Español</option>
              </select>
            </div>

            <div className="w-full flex flex-col items-start justify-items-start mt-5">
              <span className="text-xs">Target Language</span>
              <select
                id="language"
                value={language}
                onChange={handleChange}
                className="p-3 bg-white rounded-lg shadow-md mt-2 w-full"
              >
                <option value="en">🇺🇸 English</option>
                <option value="vi">🇻🇳 Tiếng Việt</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="ja">🇯🇵 日本語</option>
                <option value="es">🇪🇸 Español</option>
              </select>
            </div>

            <button className="flex items-center gap-2 bg-iris text-white rounded-full py-4 px-20 shadow-2xl mt-30 font-bold justify-center hover:bg-violet transition-colors">
              Process
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

        <div className="flex flex-col bg-smoke p-10 rounded-4xl shadow-lg w-full mt-5 h-40">
          <div className="flex items-center justify-first w-full gap-2">
            <h2 className="text-sm font-bold">Trim video</h2>
            <p className="text-sm">Select the section to process</p>
          </div>
          <div></div>
        </div>
      </main>
    </>
  );
}
