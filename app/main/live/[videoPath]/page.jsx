"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRef, useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { srtToSecondsTimestamp } from "@/lib/srt_to_second";
import { formatLanguage } from "@/lib/format_language";
import SelectBox from "@/components/SelectBox";

const LivePage = () => {
  const { data: session, status } = useSession();
  const { videoPath } = useParams();
  const searchParams = useSearchParams();
  const subtitleId = searchParams.get("subtitleId");
  const [videoData, setVideoData] = useState(null);
  const [subtitle, setSubtitle] = useState([]);
  // const [endpoints, setEndpoints] = useState([0, 0]);
  const [customize, setCustomize] = useState({});
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLocked, setIsLocked] = useState(null);
  const [isAccessible, setIsAccessible] = useState(true);
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const animationFrameId = useRef(null);

  const syncLoop = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;

      const active = subtitle.subtitle.find(
        (item) =>
          srtToSecondsTimestamp(item.start) <= time &&
          srtToSecondsTimestamp(item.end) >= time,
      );

      setCurrentSubtitle(active);
    }

    animationFrameId.current = requestAnimationFrame(syncLoop);
  }, [subtitle]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || !session) {
      router.push("/login");
      return;
    }
  }, [status, session]);

  // useEffect(() => {
  //   const video = videoRef.current;
  //   if (!video || !endpoints || endpoints.length !== 2) return;

  //   const [start, end] = endpoints;

  //   // Khi video sẵn sàng, đặt currentTime đến điểm bắt đầu
  //   const handleLoadedMetadata = () => {
  //     video.currentTime = start;
  //   };

  //   // Nếu người dùng tua ra ngoài phạm vi cho phép thì tự động đưa về lại
  //   const handleTimeUpdate = () => {
  //     if (video.currentTime < start) {
  //       video.currentTime = start;
  //     }
  //     if (video.currentTime >= end) {
  //       video.currentTime = end;
  //       video.pause();
  //     }
  //   };

  //   video.addEventListener("loadedmetadata", handleLoadedMetadata);
  //   video.addEventListener("timeupdate", handleTimeUpdate);

  //   return () => {
  //     video.removeEventListener("loadedmetadata", handleLoadedMetadata);
  //     video.removeEventListener("timeupdate", handleTimeUpdate);
  //   };
  // }, [endpoints]);

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

      if (res.status === 403) {
        setIsAccessible(false);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch stream data");
      }

      const data = await res.json();

      setVideoData(data.video);
      setSubtitle(data.subtitle);
      setCustomize(data.video.customize);
      setIsLocked(data.subtitle.locked);
      setIsOwner(data.isOwner);
      setIsAccessible(true);
    } catch (error) {
      toast.error("Error occurred! Check your Internet connection.");
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
    toast.success("Link copied to clipboard!");
  };

  const handleModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareModal(!showShareModal);
  };

  const handleChangeisLocked = async (value) => {
    setIsLocked(value);
    try {
      const res = await fetch("/api/change_stream_sharing_mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subtitleId: subtitle._id, locked: value }),
      });

      const data = await res.json();

      if (data.ok) {
        toast.success(
          `Sharing mode updated successfully to ${
            value ? "private" : "public"
          }.`,
        );
      } else {
        toast.error("Failed to update sharing mode.");
      }
    } catch (error) {
      toast.error("Failed to update sharing mode.");
    }
  };

  if (!isAccessible) {
    return (
      <>
        <main className="flex items-center justify-center h-screen">
          <p className="text-lg text-gray-600">
            You cannot access this content.
          </p>
        </main>
      </>
    );
  }

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
                        customize.background_opacity,
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
          {isOwner && (
            <button
              onClick={handleModal}
              className="flex items-center justify-center gap-2 py-2 px-6 sm:px-6 rounded-4xl text-xs sm:text-sm transition-colors bg-iris font-semibold white hover:bg-violet"
            >
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
                  d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                />
              </svg>
              <span>Share</span>
            </button>
          )}
        </div>
      </main>

      {showShareModal && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-150 flex flex-col gap-8">
            <p className="text-xl">
              Sharing "{videoData.title}" with{" "}
              {formatLanguage(subtitle.language)} subtitles{" "}
            </p>
            <div className="flex flex-col justify-center w-full sm:min-w-[220px]">
              <SelectBox
                options={[
                  { label: "Private", value: true },
                  { label: "Public", value: false },
                ]}
                label="Sharing Mode"
                value={isLocked}
                onValueChange={handleChangeisLocked}
                placeholder="Select Sharing Mode"
              />
            </div>
            <div className="flex justify-between">
              <button
                onClick={handleCopyLink}
                className="border-iris flex gap-2 rounded-4xl p-3 text-xs items-center py-1"
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
                    d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                  />
                </svg>
                Copy link
              </button>
              <button
                onClick={handleModal}
                className="flex items-center justify-center gap-2 py-2 px-6 sm:px-6 rounded-4xl text-xs sm:text-sm transition-colors bg-iris font-semibold white hover:bg-violet"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LivePage;
