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
  const [customize, setCustomize] = useState({});
  const [originalCustomize, setOriginalCustomize] = useState({});
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const [isTranscript, setIsTranscript] = useState(true);
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

  const isCustomizeChanged =
    JSON.stringify(customize) !== JSON.stringify(originalCustomize);

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

  const saveCustomizeHandler = async () => {
    if (!videoData || !isCustomizeChanged) return;
    const updatedVideos = JSON.parse(localStorage.getItem("videos")) || [];
    const index = updatedVideos.findIndex((v) => v._id === videoPath);

    if (index !== -1) {
      const subtitleId = updatedVideos[index].subtitleId;
      try {
        const response = await fetch(`/api/save_customization`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subtitleId, customize }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(`Failed to save customization: ${errorData.message}`);
        }
      } catch (error) {
        toast.error("An error occurred while saving to database.");
        return;
      }

      updatedVideos[index].customize = customize;
      localStorage.setItem("videos", JSON.stringify(updatedVideos));
      setVideoData(updatedVideos[index]);
      setOriginalCustomize(JSON.parse(JSON.stringify(customize)));
      toast.success("Customization saved to database!");
    }
  };

  const saveSubtitleHandler = async () => {
    if (!videoData || !isSubtitleChanged) return;

    const isValid = validateSubtitles();
    if (!isValid) return;

    const updatedVideos = JSON.parse(localStorage.getItem("videos")) || [];
    const index = updatedVideos.findIndex((v) => v._id === videoPath);
    if (index !== -1) {
      const subtitleId = updatedVideos[index].subtitleId;
      try {
        const response = await fetch(`/api/save_subtitle`, {
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
      setCustomize(found.customize);
      setOriginalSubtitle(clonedSubtitle);
      setOriginalCustomize(found.customize);
    } else {
      toast.error("Cannot find video data!");
    }
  }, [videoPath]);

  let subtitleClasses = `text-[${customize.font_size}px] ${
    customize.is_bold ? "font-bold" : ""
  } ${customize.is_italic ? "italic" : ""} ${
    customize.is_underline ? "underline" : ""
  }  text-[${
    customize.font_color
  }] absolute left-1/2 transform -translate-x-1/2 text-center leading-tight break-words inline-block max-w-full 
bg-[${customize.background_color}]`;


  const strokeLayers = [];
  const steps = 64; // 128 hướng
  const radius = customize.outline_width; // độ dày viền

  for (let i = 0; i < steps; i++) {
    const angle = (i * 360) / steps;
    const rad = (angle * Math.PI) / 180; // Đổi sang radian

    const x = (Math.cos(rad) * radius).toFixed(2);
    const y = (Math.sin(rad) * radius).toFixed(2);

    strokeLayers.push(`${x}px ${y}px 0 ${customize.outline_color}`);
  }

  const textShadow = strokeLayers.join(", ");

  function hexToRGBA(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  }

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

  const handleGenerateVideo = async () => {
    try {
      const response = await fetch("/api/generate_video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subtitle,
          customize,
          directUrl: videoData.directUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error("Failed to generate ASS file:", errorData.message);
        return;
      }

      const data = await response.json();
      console.log(data);
    } catch (error) {
      toast.error("Error:", error);
    }
  };

  return (
    <>
      <MainNavbar />

      <main className="flex flex-col items-center h-screen p-5">
        <div className="flex justify-between items-center w-full flex-1 gap-5 mt-20 overflow-hidden">
          <div className="flex flex-col h-full w-3/5 gap-5">
            <div className="flex items-center justify-center w-full bg-black rounded-2xl h-4/5">
              <div className="relative w-full">
                <video
                  ref={videoRef}
                  controls
                  src={videoData.directUrl}
                  className="shadow-xl w-full m-auto"
                ></video>
                {currentSubtitle && (
                  <div
                    className={subtitleClasses}
                    style={{
                      color: customize.font_color,
                      bottom: `${customize.margin_bottom}px`,
                      backgroundColor: `${
                        customize.border_style === "dropshadow"
                          ? "transparent"
                          : hexToRGBA(
                              customize.background_color,
                              customize.background_opacity
                            )
                      }`,
                      textShadow: textShadow,
                      fontFamily: customize.font_family,
                    }}
                  >
                    {currentSubtitle.text}
                  </div>
                )}
              </div>
            </div>
            <div className="h-1/5 w-full bg-smoke rounded-2xl flex items-center justify-center gap-3">
              <button className="py-2 px-3 rounded-4xl text-sm transition-colors bg-gray white hover:bg-light-gray">
                Download .srt
              </button>
              <button className="py-2 px-3 rounded-4xl text-sm transition-colors bg-gray white hover:bg-light-gray">
                Download .ass
              </button>
              <button className="py-2 px-3 rounded-4xl text-sm transition-colors bg-gray white hover:bg-light-gray">
                Download .txt
              </button>
              <button
                onClick={handleGenerateVideo}
                className="flex items-center gap-2 py-2 px-3 font-semibold rounded-4xl text-sm transition-colors bg-iris text-white hover:bg-violet"
              >
                Generate Video
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                  />
                </svg>
              </button>
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
                  onClick={saveSubtitleHandler}
                  disabled={!isSubtitleChanged}
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <SubtitleStylingBox
                  customize={customize}
                  setCustomize={setCustomize}
                ></SubtitleStylingBox>
                <button
                  className={`flex items-center gap-2 px-10 py-1 text-white rounded-full shadow-2xl font-bold justify-center transition-colors ${
                    isCustomizeChanged
                      ? "bg-iris hover:bg-violet cursor-pointer"
                      : "bg-gray cursor-not-allowed"
                  }`}
                  onClick={saveCustomizeHandler}
                  disabled={!isCustomizeChanged}
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;
