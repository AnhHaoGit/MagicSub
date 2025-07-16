"use client";

import { Range } from "react-range";
import { formatTime } from "@/lib/format_time";

const VideoTrimmer = ({ STEP, videoData, values, setValues }) => {

  return (
    <>
      {videoData?.duration ? (
        <>
          <Range
            step={STEP}
            min={0}
            max={videoData.duration}
            values={values}
            onChange={(vals) => setValues(vals)}
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
                    left: `${(values[0] / videoData.duration) * 100}%`,
                    width: `${((values[1] - values[0]) / videoData.duration) * 100}%`,
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
                  style={{
                    height: "20px",
                    width: "20px",
                    backgroundColor: "#4C3BCF",
                    borderRadius: "50%",
                    outline: "none",
                    border: "2px solid white",
                    boxShadow: "0 0 4px rgba(0,0,0,0.3)",
                    position: "absolute",
                    cursor: "grabbing",
                  }}
                  aria-label={index === 0 ? "Start" : "End"}
                />
              );
            }}
          />
          <div className="flex justify-between text-sm mt-2">
            <span>Start: {formatTime(values[0])}</span>
            <span>End: {formatTime(values[1])}</span>
          </div>
        </>
      ) : (
        <p className="text-gray-500 italic">Loading trimmer...</p>
      )}
    </>
  );
};

export default VideoTrimmer;
