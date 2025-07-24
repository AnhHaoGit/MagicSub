"use client";

import MainNavbar from "@/components/MainNavbar";
import SubtitleScrollBox from "@/components/SubtitleScrollBox";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { srtToSecondsTimestamp } from "@/lib/srt_to_second";

const Page = () => {
  const { videoPath } = useParams();
  const [videoData, setVideoData] = useState(null);
  const [subtitle, setSubtitle] = useState([]);
  const [originalSubtitle, setOriginalSubtitle] = useState([]);

  const isSubtitleChanged =
    JSON.stringify(subtitle) !== JSON.stringify(originalSubtitle);

  const validateSubtitles = () => {
    for (let i = 0; i < subtitle.length; i++) {
      const current = subtitle[i];
      const currentStart = srtToSecondsTimestamp(current.start);
      const currentEnd = srtToSecondsTimestamp(current.end);

      if (currentStart >= currentEnd) {
        toast.error(`Subtitle #${i + 1}: End time must be after start time.`);
        return false;
      }

      if (i < subtitle.length - 1) {
        const next = subtitle[i + 1];
        const nextStart = srtToSecondsTimestamp(next.start);

        if (currentStart > nextStart) {
          toast.error(
            `Subtitle #${i + 1} starts after Subtitle #${
              i + 2
            }. Please reorder the subtitles.`
          );
          return false;
        }

        if (currentEnd > nextStart) {
          toast.error(
            `Subtitle #${i + 1} overlaps with Subtitle #${
              i + 2
            }. Please fix the timings.`
          );
          return false;
        }
      }
    }

    return true;
  };

  const saveHandler = () => {
    if (!videoData || !isSubtitleChanged) return;

    const isValid = validateSubtitles();
    if (!isValid) return;

    const updatedVideos = JSON.parse(localStorage.getItem("videos")) || [];
    const index = updatedVideos.findIndex((v) => v._id === videoPath);
    if (index !== -1) {
      updatedVideos[index].subtitle = subtitle;
      localStorage.setItem("videos", JSON.stringify(updatedVideos));
      setVideoData(updatedVideos[index]);
      setOriginalSubtitle(JSON.parse(JSON.stringify(subtitle)));
      toast.success("Subtitle saved!");
    }
  };

  useEffect(() => {
    const video = JSON.parse(localStorage.getItem("videos")) || [];
    const found = video.find((v) => v._id === videoPath);
    if (found) {
      setVideoData(found);
      const clonedSubtitle = JSON.parse(JSON.stringify(found.subtitle));
      setSubtitle(clonedSubtitle);
      setOriginalSubtitle(clonedSubtitle);
    }
  }, [videoPath]);

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
      <MainNavbar />

      <main className="flex flex-col items-center h-screen p-5">
        <h1 className="text-2xl font-bold text-center mt-20">
          Custom your title here!
        </h1>
        <div className="flex justify-between items-start w-full flex-1 gap-5 mt-5 overflow-hidden">
          <div className="w-3/5">
            <video
              controls
              src={videoData.directUrl}
              className="rounded-xl shadow-xl w-full"
            ></video>
          </div>
          <div className="w-2/5 h-full flex flex-col justify-evenly items-center gap-4 bg-smoke rounded-2xl p-5">
            <p className="text-xl font-semibold">Subtitle Editor</p>

            <SubtitleScrollBox subtitle={subtitle} setSubtitle={setSubtitle} />

            <button
              className={`flex items-center gap-2 px-10 py-1 text-white rounded-full shadow-2xl font-bold justify-center transition-colors cursor-pointer ${
                isSubtitleChanged
                  ? "bg-iris hover:bg-violet"
                  : "bg-gray cursor-not-allowed"
              }`}
              onClick={saveHandler}
              disabled={!isSubtitleChanged}
            >
              Save
            </button>
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;
