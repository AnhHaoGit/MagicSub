"use client";

import MainNavbar from "@/components/MainNavbar";
import SubtitleScrollBox from "@/components/SubtitleScrollBox";
import { useParams } from "next/navigation";
import { useRef, useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";

import { srtToSecondsTimestamp } from "@/lib/srt_to_second";
import SubtitleStylingBox from "@/components/SubtitleStylingBox";

const Page = () => {
  const { videoPath } = useParams();
  const [videoData, setVideoData] = useState(null);
  const [subtitle, setSubtitle] = useState([]);
  const [originalSubtitle, setOriginalSubtitle] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const [isTranscript, setIsTranscript] = useState(false);
  const videoRef = useRef(null);
  const animationFrameId = useRef(null);

  // can not use useEffect right here because we need to save reference whenever we run requestAnimationFrame.
  // if we use useEffect, the syncLoop will be recreated when calling requestAnimationFrame, resulting in bugs.
  const syncLoop = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;

      const active = subtitle.find(
        (item) =>
          srtToSecondsTimestamp(item.start) <= time &&
          srtToSecondsTimestamp(item.end) >= time
      );

      setCurrentSubtitle(active);
    }

    // Schedule the next sync using requestAnimationFrame for smooth updates
    animationFrameId.current = requestAnimationFrame(syncLoop);
  }, [subtitle]); // Re-create this function only when 'subtitle' changes

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => {
      if (!animationFrameId.current) {
        syncLoop();
      }
    };

    const handlePause = () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };

    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("ended", handlePause);

    // Cleanup function to remove event listeners when component unmounts or deps change
    return () => {
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("ended", handlePause);
    };
  }, [syncLoop]); // Re-run effect only when syncLoop function changes

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

  const saveHandler = async () => {
    if (!videoData || !isSubtitleChanged) return;

    const isValid = validateSubtitles();
    if (!isValid) return;

    const updatedVideos = JSON.parse(localStorage.getItem("videos")) || [];
    const index = updatedVideos.findIndex((v) => v._id === videoPath);
    if (index !== -1) {
      const subtitleId = updatedVideos[index].subtitleId;
      try {
        const response = await fetch(`/api/save`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subtitleId, subtitle }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(`Failed to save subtitle: ${errorData.message}`);
        }
      } catch (error) {
        toast.error("An error occurred while saving to database.");
        return;
      }

      updatedVideos[index].subtitle = subtitle;
      localStorage.setItem("videos", JSON.stringify(updatedVideos));
      setVideoData(updatedVideos[index]);
      setOriginalSubtitle(JSON.parse(JSON.stringify(subtitle)));
      toast.success("Subtitle saved to database!");
    }
  };

  const handleTranscriptButton = () => {
    setIsTranscript(true);
  };

  const handleStyleButton = () => {
    setIsTranscript(false);
  };

  useEffect(() => {
    const video = JSON.parse(localStorage.getItem("videos")) || [];
    const found = video.find((v) => v._id === videoPath);
    if (found) {
      setVideoData(found);
      const clonedSubtitle = JSON.parse(JSON.stringify(found.subtitle));
      setSubtitle(clonedSubtitle);
      setOriginalSubtitle(clonedSubtitle);
    } else {
      toast.error('Cannot find video data!')
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
        <div className="flex justify-between items-center w-full flex-1 gap-5 mt-20 overflow-hidden">
          <div className="flex items-center justify-center w-3/5 bg-black rounded-2xl h-full">
            <div className="relative w-full">
              <video
                ref={videoRef}
                controls
                src={videoData.directUrl}
                className="shadow-xl w-full m-auto"
              ></video>
              {currentSubtitle && (
                <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white p-1 text-sm text-center leading-tight break-words inline-block max-w-full">
                  {currentSubtitle.text}
                </div>
              )}
            </div>
          </div>
          <div className="w-2/5 h-full flex flex-col relative justify-evenly items-center gap-4 bg-smoke rounded-2xl p-5">
            <div className="flex items-center justify-center absolute top-3 shadow-lg gap-5 bg-white p-2 rounded-4xl">
              <button
                onClick={handleTranscriptButton}
                className={`w-30 py-2 rounded-4xl font-semibold transition-colors ${
                  isTranscript
                    ? "bg-iris text-white hover:bg-violet"
                    : "bg-gray white hover:bg-light-gray"
                }`}
              >
                Transcript
              </button>

              <button
                onClick={handleStyleButton}
                className={`w-30 py-2 rounded-4xl font-semibold transition-colors ${
                  !isTranscript
                    ? "bg-iris text-white hover:bg-violet"
                    : "bg-gray white hover:bg-light-gray"
                }`}
              >
                Style
              </button>
            </div>

            {isTranscript ? (
              <>
                <SubtitleScrollBox
                  subtitle={subtitle}
                  setSubtitle={setSubtitle}
                  activeSubtitleIndex={
                    currentSubtitle ? currentSubtitle.index : null
                  }
                />

                <button
                  className={`flex items-center gap-2 px-10 py-1 text-white rounded-full shadow-2xl font-bold justify-center transition-colors ${
                    isSubtitleChanged
                      ? "bg-iris hover:bg-violet cursor-pointer"
                      : "bg-gray cursor-not-allowed"
                  }`}
                  onClick={saveHandler}
                  disabled={!isSubtitleChanged}
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <SubtitleStylingBox></SubtitleStylingBox>
                <div className="flex items-center justify-center gap-5">
                  <button className="px-5 py-2 rounded-4xl font-semibold transition-colors bg-gray white hover:bg-light-gray">
                    Reset to Default
                  </button>
                  <button className="px-5 py-2 rounded-4xl font-semibold transition-colors bg-gray white hover:bg-light-gray">
                    Save as Default
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;
