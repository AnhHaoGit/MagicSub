"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useRef, useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { srtToSecondsTimestamp } from "@/lib/srt_to_second";
import Link from "next/link";

const LivePage = () => {
  const { videoPath } = useParams();
  const searchParams = useSearchParams();
  const subtitleId = searchParams.get("subtitleId");
  const [videoData, setVideoData] = useState(null);
  const [subtitle, setSubtitle] = useState([]);
  const [endpoints, setEndpoints] = useState([0, 0]);
  const [customize, setCustomize] = useState({});
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const animationFrameId = useRef(null);
  const [copied, setCopied] = useState(false);

  const syncLoop = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;

      const active = subtitle.subtitle.find(
        (item) =>
          srtToSecondsTimestamp(item.start) <= time &&
          srtToSecondsTimestamp(item.end) >= time
      );

      setCurrentSubtitle(active);
    }

    animationFrameId.current = requestAnimationFrame(syncLoop);
  }, [subtitle]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !endpoints || endpoints.length !== 2) return;

    const [start, end] = endpoints;

    // Khi video sẵn sàng, đặt currentTime đến điểm bắt đầu
    const handleLoadedMetadata = () => {
      video.currentTime = start;
    };

    // Nếu người dùng tua ra ngoài phạm vi cho phép thì tự động đưa về lại
    const handleTimeUpdate = () => {
      if (video.currentTime < start) {
        video.currentTime = start;
      }
      if (video.currentTime >= end) {
        video.currentTime = end;
        video.pause()
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [endpoints]);

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

    return () => {
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("ended", handlePause);
    };
  }, [syncLoop]);

  const fetchData = async (videoId, subtitleId) => {
    try {
      const res = await fetch("/api/fetch_stream_data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId, subtitleId }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch stream data");
      }

      const data = await res.json();
      setVideoData(data.video);
      setSubtitle(data.subtitle);
      setEndpoints(data.subtitle.endpoints);
      setCustomize(data.video.customize);
    } catch (error) {
      toast.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (videoPath && subtitleId) {
      fetchData(videoPath, subtitleId);
    }
  }, [videoPath, subtitleId]);

  let subtitleClasses = `${customize.is_bold ? "font-bold" : ""} ${
    customize.is_italic ? "italic" : ""
  } ${customize.is_underline ? "underline" : ""}  text-[${
    customize.font_color
  }] absolute left-1/2 transform -translate-x-1/2 text-center leading-tight break-words inline-block max-w-full
bg-[${customize.background_color}] ${
    customize.position === "bottom" && "bottom-10"
  } ${
    customize.position === "middle" && "top-1/2 transform -translate-y-1/2"
  } ${customize.position === "top" && "top-10"}`;

  const strokeLayers = [];
  const steps = 64;
  const radius = customize.outline_width;

  for (let i = 0; i < steps; i++) {
    const angle = (i * 360) / steps;
    const rad = (angle * Math.PI) / 180;

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!videoData) {
    return (
      <>
        <main className="flex items-center justify-center h-screen">
          <p className="text-lg text-gray-600">Loading video data...</p>
        </main>
      </>
    );
  }
  return (
    <>
      <main className="flex flex-col items-center justify-center h-screen sm:p-4 md:p-5">
        <div
          className="relative w-full h-9/10 bg-black rounded-2xl shadow-xl flex items-center justify-center"
          ref={containerRef}
        >
          <video
            ref={videoRef}
            controls
            src={videoData.cloudUrl}
            className="w-full max-h-full rounded-xl"
          ></video>

          {currentSubtitle && (
            <div
              className={subtitleClasses}
              style={{
                color: customize.font_color,
                fontSize: `calc(${customize.font_size / 8}vw)`,
                backgroundColor:
                  customize.border_style === "text_outline"
                    ? "transparent"
                    : hexToRGBA(
                        customize.background_color,
                        customize.background_opacity
                      ),
                textShadow:
                  customize.border_style === "text_outline"
                    ? textShadow
                    : "none",
                fontFamily: customize.font_family,
              }}
            >
              {currentSubtitle.text}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 sm:mt-10">
          <button
            onClick={() => {
              if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
              }
            }}
            className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray transition-colors flex text-sm items-center gap-2"
          >
            Full Screen
          </button>
          <button
            className="flex items-center justify-center gap-2 py-2 px-6 sm:px-10 rounded-4xl text-xs sm:text-sm transition-colors bg-iris font-semibold white hover:bg-violet"
            onClick={handleCopyLink}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-4 sm:size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
              />
            </svg>
            <span>{copied ? "Copied!" : "Copy Link"}</span>
          </button>

          <div className="text-center sm:text-left gray text-xs sm:text-sm">
            <p>
              Made with ❤️ by{" "}
              <Link
                href={process.env.NEXT_PUBLIC_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="iris hover:underline"
              >
                MagicSub
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default LivePage;
