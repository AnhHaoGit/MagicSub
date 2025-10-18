"use client";

import { useEffect, useRef, useState } from "react";
import { Range } from "react-range";
import { formatTime } from "@/lib/format_time";

const VideoTrimmer = ({ STEP, videoData, endpoints, setEndpoints, videoRef }) => {
  const wasPlayingRef = useRef(false);
  const [activeThumbIndex, setActiveThumbIndex] = useState(null);

  const handleBeforeChange = (vals, index) => {
    const video = videoRef?.current;
    if (!video) return;
    wasPlayingRef.current = !video.paused;
    video.pause();
    setActiveThumbIndex(index);
  };

  const handleChange = (vals) => {
    setEndpoints(vals);
    const video = videoRef?.current;
    if (video) {
      if (activeThumbIndex === 0) {
        video.currentTime = vals[0];
      } else if (activeThumbIndex === 1) {
        video.currentTime = vals[1];
      }
    }
  };

  const handleFinalChange = () => {
    const video = videoRef?.current;
    if (!video) return;
    if (wasPlayingRef.current) {
      video.play();
    }
    setActiveThumbIndex(null);
  };

  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.currentTime < endpoints[0]) {
        video.pause();
        video.currentTime = endpoints[0];
      }
      if (video.currentTime > endpoints[1]) {
        video.pause();
        video.currentTime = endpoints[1];
      }
    };

    const handleSeeking = () => {
      if (video.currentTime < endpoints[0]) {
        video.currentTime = endpoints[0];
      }
      if (video.currentTime > endpoints[1]) {
        video.currentTime = endpoints[1];
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("seeking", handleSeeking);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("seeking", handleSeeking);
    };
  }, [videoRef, endpoints]);

  return (
    <>
      {videoData?.duration ? (
        <div className="flex items-center gap-8">
          <span className="text-xs gray">{formatTime(endpoints[0])}</span>
          <Range
            step={STEP}
            min={0}
            max={videoData.duration}
            values={endpoints}
            onBeforeChange={(vals, index) => handleBeforeChange(vals, index)}
            onChange={handleChange}
            onFinalChange={handleFinalChange}
            renderTrack={({ props, children }) => (
              <div
                {...props}
                style={{
                  ...props.style,
                  position: "relative",
                  height: "8px",
                  width: "100%",
                  backgroundColor: "#ddd",
                  borderRadius: "4px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    height: "100%",
                    backgroundColor: "#4C3BCF",
                    borderRadius: "4px",
                    left: `${(endpoints[0] / videoData.duration) * 100}%`,
                    width: `${
                      ((endpoints[1] - endpoints[0]) / videoData.duration) * 100
                    }%`,
                  }}
                />
                {children}
              </div>
            )}
            renderThumb={({ props, index }) => {
              const { key, ...restProps } = props;
              return (
                <div
                  key={key}
                  {...restProps}
                  onMouseDown={() => setActiveThumbIndex(index)}
                  onTouchStart={() => setActiveThumbIndex(index)}
                  style={{
                    height: "15px",
                    width: "15px",
                    backgroundColor: "#4C3BCF",
                    borderRadius: "50%",
                    outline: "none",
                    border: "2px solid white",
                    boxShadow: "0 0 4px rgba(0,0,0,0.3)",
                    position: "absolute",
                    cursor: "grab",
                  }}
                  aria-label={index === 0 ? "Start" : "End"}
                />
              );
            }}
          />
          <span className="text-xs gray">{formatTime(endpoints[1])}</span>
        </div>
      ) : (
        <p className="text-gray-500 italic">Loading trimmer...</p>
      )}
    </>
  );
};

export default VideoTrimmer;
