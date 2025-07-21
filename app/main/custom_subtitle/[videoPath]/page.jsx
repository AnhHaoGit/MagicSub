"use client";

import MainNavbar from "@/components/MainNavbar";
import SubtitleEditor from "@/components/SubtitleEditor";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const Page = () => {
  const { videoPath } = useParams();
  const [videoData, setVideoData] = useState(null);

  useEffect(() => {
    const video = JSON.parse(localStorage.getItem("videos")) || [];
    const found = video.find((v) => v._id === videoPath);
    setVideoData(found);
  }, [videoPath]);

  console.log(videoData);
  if (!videoData) {
    return (
      <>
        <MainNavbar />
        <main className="flex items-center justify-center h-screen">
          <p className="text-lg text-gray-600">Loading video data...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <MainNavbar></MainNavbar>

      <main className="flex flex-col items-center h-screen p-5">
        <h1 className="text-4xl font-bold text-center mt-24">
          Custom your title here!
        </h1>
        <div className="flex justify-between items-start w-full flex-1 gap-5 mt-10 overflow-hidden">
          <div className="w-3/5">
            <video
              controls
              src={videoData.directUrl}
              className="rounded-xl shadow-xl w-full"
            ></video>
          </div>
          <div className="w-2/5 h-full flex flex-col bg-smoke rounded-2xl shadow-lg p-5">
            <p className="text-lg font-semibold mb-2">Subtitle Editor</p>
            <div className="flex-1 overflow-y-auto">
              <SubtitleEditor subtitle={videoData.subtitle} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;
