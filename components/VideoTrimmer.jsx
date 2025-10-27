"use client";

import { useEffect, useRef, useState } from "react";
import { Range } from "react-range";
import { formatTime } from "@/lib/format_time";

const parseTimeToSeconds = (timeStr) => {
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else {
    return Number(timeStr) || 0;
  }
};

// ✅ Thêm hàm kiểm tra input
const validateTimeInput = (timeStr) => {
  // Cho phép định dạng: hh:mm:ss, mm:ss, hoặc hh:mm:ss.xx
  const regex = /^(\d{1,2}:)?\d{1,2}:\d{1,2}(\.\d{1,2})?$/;
  return regex.test(timeStr);
};

const VideoTrimmer = ({
  STEP,
  videoData,
  endpoints,
  setEndpoints,
  videoRef,
}) => {
  const wasPlayingRef = useRef(false);
  const [activeThumbIndex, setActiveThumbIndex] = useState(null);
  const [startInput, setStartInput] = useState("00:00:00.00");
  const [endInput, setEndInput] = useState("00:00:00.00");

  // Đồng bộ input khi endpoints thay đổi
  useEffect(() => {
    if (Array.isArray(endpoints) && endpoints.length === 2) {
      setStartInput(formatTime(endpoints[0]));
      setEndInput(formatTime(endpoints[1]));
    }
  }, [endpoints]);

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
      video.currentTime = vals[activeThumbIndex];
    }
    setStartInput(formatTime(vals[0]));
    setEndInput(formatTime(vals[1]));
  };

  const handleFinalChange = () => {
    const video = videoRef?.current;
    if (!video) return;
    if (wasPlayingRef.current) video.play();
    setActiveThumbIndex(null);
  };

  const handleInputChange = (e, index) => {
    const val = e.target.value;
    if (index === 0) setStartInput(val);
    else setEndInput(val);
  };

  const handleInputBlur = (index) => {
    const inputValue = index === 0 ? startInput : endInput;
    const videoDuration = videoData?.duration || 0;

    // ✅ Kiểm tra định dạng
    if (!validateTimeInput(inputValue)) {
      // Reset về giá trị cũ (endpoints)
      if (index === 0) {
        setStartInput(formatTime(endpoints[0]));
      } else {
        setEndInput(formatTime(endpoints[1]));
      }
      return;
    }

    let parsedStart = parseTimeToSeconds(startInput);
    let parsedEnd = parseTimeToSeconds(endInput);

    // ✅ Nếu quá thời lượng video → set lại bằng max hợp lệ
    parsedStart = Math.min(Math.max(parsedStart, 0), videoDuration);
    parsedEnd = Math.min(Math.max(parsedEnd, 0), videoDuration);

    // Nếu end < start thì fix lại
    if (parsedEnd < parsedStart) parsedEnd = parsedStart;

    const newEndpoints = [parsedStart, parsedEnd];
    setEndpoints(newEndpoints);

    // Cập nhật lại input hiển thị
    setStartInput(formatTime(parsedStart));
    setEndInput(formatTime(parsedEnd));

    // Seek video
    const video = videoRef?.current;
    if (video) video.currentTime = newEndpoints[index];
  };

  // Giới hạn phát video trong khoảng được chọn
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
      if (video.currentTime < endpoints[0]) video.currentTime = endpoints[0];
      if (video.currentTime > endpoints[1]) video.currentTime = endpoints[1];
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
        <div className="flex items-center gap-5">
          <input
            type="text"
            value={startInput}
            onChange={(e) => handleInputChange(e, 0)}
            onBlur={() => handleInputBlur(0)}
            className="text-[10px] w-[70px] border border-gray-300 rounded-md px-1 py-[2px] text-center"
          />

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

          <input
            type="text"
            value={endInput}
            onChange={(e) => handleInputChange(e, 1)}
            onBlur={() => handleInputBlur(1)}
            className="text-[10px] w-[70px] border border-gray-300 rounded-md px-1 py-[2px] text-center"
          />
        </div>
      ) : (
        <p className="text-gray-500 italic">Loading trimmer...</p>
      )}
    </>
  );
};

export default VideoTrimmer;
