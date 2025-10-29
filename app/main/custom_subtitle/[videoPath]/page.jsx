"use client";

import MainNavbar from "@/components/MainNavbar";
import SubtitleScrollBox from "@/components/SubtitleScrollBox";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useRef, useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { srtToSecondsTimestamp } from "@/lib/srt_to_second";
import SubtitleStylingBox from "@/components/SubtitleStylingBox";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import Link from "next/link";
import { formatTime } from "@/lib/format_time";
import fetch_data from "@/lib/fetch_data";
import { update_cloud_urls_to_local_storage_by_video_id } from "@/lib/local_storage_handlers";
import { useSession } from "next-auth/react";

const Page = () => {
  const { videoPath } = useParams();
  const searchParams = useSearchParams();
  const subtitleId = searchParams.get("subtitleId");
  const [videoData, setVideoData] = useState(null);
  const [subtitle, setSubtitle] = useState([]);
  const [endpoints, setEndpoints] = useState([0, 0]);
  const [originalSubtitle, setOriginalSubtitle] = useState([]);
  const [customize, setCustomize] = useState({});
  const [originalCustomize, setOriginalCustomize] = useState({});
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const [isTranscript, setIsTranscript] = useState(true);
  const videoRef = useRef(null);
  const animationFrameId = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingSrt, setIsDownloadingSrt] = useState(false);
  const [isDownloadingAss, setIsDownloadingAss] = useState(false);
  const [isDownloadingTxt, setIsDownloadingTxt] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session && status === "authenticated") {
      fetch_data(session);
    }
  }, [session, status]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session) {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !endpoints || endpoints.length !== 2) return;

    const [start, end] = endpoints;

    const handleLoadedMetadata = () => {
      video.currentTime = start;
    };

    const handleTimeUpdate = () => {
      if (video.currentTime < start) {
        video.currentTime = start;
      }
      if (video.currentTime >= end) {
        video.currentTime = end;
        video.pause();
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [endpoints]);

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
      try {
        const response = await fetch(`/api/save_customization`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoId: updatedVideos[index]._id,
            customize,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(`Failed to save customization: ${errorData.message}`);
          return;
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
      const clonedSubtitles = JSON.parse(JSON.stringify(found.subtitles));
      const clonedSubtitle = clonedSubtitles.find(
        (sub) => sub._id === subtitleId
      );
      setSubtitle(clonedSubtitle.subtitle);
      setEndpoints(clonedSubtitle.endpoints);
      setCustomize(found.customize);
      setOriginalSubtitle(clonedSubtitle.subtitle);
      setOriginalCustomize(found.customize);
    } else {
      toast.error("Cannot find video data!");
    }
  }, [videoPath]);

  let subtitleClasses = `${customize.is_bold ? "font-bold" : ""} ${
    customize.is_italic ? "italic" : ""
  } ${customize.is_underline ? "underline" : ""}  text-[${
    customize.font_color
  }] absolute left-1/2 transform -translate-x-1/2 text-center leading-tight break-words inline-block max-w-full
bg-[${customize.background_color}] ${
    customize.position === "bottom" && "bottom-15"
  } ${
    customize.position === "middle" && "top-1/2 transform -translate-y-1/2"
  } ${customize.position === "top" && "top-15"}`;

  const strokeLayers = [];
  const steps = 64;
  const radius = customize.outline_width;

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

  const handleGenerateVideo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate_video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subtitle,
          customize,
          cloudUrl: videoData.cloudUrl,
          videoId: videoData._id,
          userId: videoData.userId,
          endpoints,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error("Failed to generate video:", errorData.message);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      update_cloud_urls_to_local_storage_by_video_id(
        videoData._id,
        data.cloudUrl
      );
      toast.success("ASS video generated successfully!");
      router.push(`/main/result/${videoData._id}/${data.cloudUrl.id}`);
    } catch (error) {
      toast.error("Error:", error);
    }
    setIsLoading(false);
  };

  const handleDownloadSrt = async () => {
    setIsDownloadingSrt(true);

    const res = await fetch("/api/download_srt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtitle }),
    });

    if (!res.ok) {
      alert("Download failed");
      setIsDownloadingSrt(false);
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subtitles.srt";
    a.click();
    window.URL.revokeObjectURL(url);

    setIsDownloadingSrt(false);
  };

  const handleDownloadAss = async () => {
    setIsDownloadingAss(true);

    const res = await fetch("/api/download_ass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtitle, customize }),
    });

    if (!res.ok) {
      alert("Download failed");
      setIsDownloadingAss(false);
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subtitles.ass";
    a.click();
    window.URL.revokeObjectURL(url);

    setIsDownloadingAss(false);
  };

  const handleDownloadTxt = async () => {
    setIsDownloadingTxt(true);

    const res = await fetch("/api/download_txt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtitle }),
    });

    if (!res.ok) {
      console.error("Failed to generate txt");
      setIsDownloadingTxt(false);
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subtitles.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setIsDownloadingTxt(false);
  };

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

      <main className="flex flex-col lg:flex-row justify-between h-screen items-center w-full flex-1 gap-5 pt-25 p-5">
        <div className="flex flex-col items-center justify-evenly bg-smoke rounded-2xl h-full w-full lg:w-3/5 gap-5">
          <div className="relative flex items-center bg-black justify-center h-4/5 w-full rounded-2xl">
            <video
              ref={videoRef}
              controls
              src={videoData.cloudUrl}
              className="shadow-xl w-full max-h-full m-auto rounded-xl"
            ></video>
            {currentSubtitle && (
              <div
                className={subtitleClasses}
                style={{
                  color: customize.font_color,
                  fontSize: `calc(${customize.font_size / 12}vw)`,
                  backgroundColor: `${
                    customize.border_style === "text_outline"
                      ? "transparent"
                      : hexToRGBA(
                          customize.background_color,
                          customize.background_opacity
                        )
                  }`,
                  textShadow: `${
                    customize.border_style === "text_outline"
                      ? textShadow
                      : "none"
                  }`,
                  fontFamily: customize.font_family,
                }}
              >
                {currentSubtitle.text}
              </div>
            )}
          </div>

          {/* Buttons row */}
          <div className="py-5 w-9/10 bg-white rounded-2xl flex flex-wrap sm:flex-nowrap items-center justify-center">
            <div className="flex justify-center items-end gap-3">
              <button
                className="py-2 px-3 rounded-4xl text-[9px] sm:text-[10px] md:text-xs lg:text-sm transition-colors bg-black white hover:bg-gray"
                onClick={handleDownloadSrt}
                disabled={isDownloadingSrt}
              >
                {isDownloadingSrt ? "Downloading..." : "Download .srt"}
              </button>
              <button
                className="py-2 px-3 rounded-4xl text-[9px] sm:text-[10px] md:text-xs lg:text-sm transition-colors bg-black white hover:bg-gray"
                onClick={handleDownloadAss}
                disabled={isDownloadingAss}
              >
                {isDownloadingAss ? "Downloading..." : "Download .ass"}
              </button>
              <button
                className="py-2 px-3 rounded-4xl text-[9px] sm:text-[10px] md:text-xs lg:text-sm transition-colors bg-black white hover:bg-gray"
                onClick={handleDownloadTxt}
                disabled={isDownloadingTxt}
              >
                {isDownloadingTxt ? "Downloading..." : "Download .txt"}
              </button>
              <button
                onClick={handleGenerateVideo}
                className="flex items-center gap-2 py-2 px-3 font-semibold rounded-4xl text-[9px] sm:text-[10px] md:text-xs lg:text-sm transition-colors bg-iris text-white hover:bg-violet"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <p>Generating</p>
                    <Spinner key="ellipsis" variant="ellipsis" />
                  </>
                ) : (
                  <>
                    <p>Generate Video</p>
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
                        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                      />
                    </svg>
                  </>
                )}
              </button>
              <div className="flex flex-col items-center">
                <span className="hidden md:text-[10px] md:text-gray-500 md:font-bold md:mb-1 md:inline">
                  New Feature
                </span>
                <Link
                  href={`/main/live/${videoData._id}?subtitleId=${subtitleId}`}
                  className="py-2 px-3 rounded-4xl text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold transition-colors bg-iris text-white hover:bg-violet"
                >
                  Stream Video
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="w-full lg:w-2/5 flex flex-col justify-evenly items-center h-auto lg:h-full gap-2 bg-smoke rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-center shadow-lg gap-3 sm:gap-5 bg-white p-2 rounded-4xl">
            <button
              onClick={handleTranscriptButton}
              className={`w-24 gap-2 sm:w-30 flex justify-center items-center sm:text-base black hover:bg-zinc-200 rounded-2xl py-1`}
            >
              {isTranscript ? (
                <div className="h-[10px] w-[10px] rounded-full bg-iris"></div>
              ) : (
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
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
              )}
              <span className="text-xs">Transcript</span>
            </button>
            <button
              onClick={handleStyleButton}
              className={`w-24 gap-2 sm:w-30 flex justify-center items-center sm:text-base black hover:bg-zinc-200 rounded-2xl py-1`}
            >
              {!isTranscript ? (
                <div className="h-[10px] w-[10px] rounded-full bg-iris"></div>
              ) : (
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
                    d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
                  />
                </svg>
              )}
              <span className="text-xs">Style</span>
            </button>
          </div>

          {endpoints ? (
            <p className="gray text-xs">
              Trimmed from {formatTime(endpoints[0])} to{" "}
              {formatTime(endpoints[1])}
            </p>
          ) : (
            <p>loading...</p>
          )}

          {isTranscript ? (
            <>
              <SubtitleScrollBox
                subtitle={subtitle}
                setSubtitle={setSubtitle}
                activeSubtitleIndex={
                  currentSubtitle ? currentSubtitle.index : null
                }
                videoRef={videoRef}
              />

              <button
                className={`flex items-center gap-2 px-6 sm:px-10 py-1 text-white rounded-full shadow-2xl font-bold justify-center transition-colors ${
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
              />

              <button
                className={`flex items-center gap-2 px-6 sm:px-10 py-1 text-white rounded-full shadow-2xl font-bold justify-center transition-colors ${
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
      </main>
    </>
  );
};

export default Page;
