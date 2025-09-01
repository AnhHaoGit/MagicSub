"use client";
import { useState, useEffect } from "react";

const RotatingTexts = () => {
  const words = [
    "YouTube",
    "Instagram",
    "Tiktok",
    "Lecture",
    "Podcast",
    "Facebook",
    "Twitter",
    "Zoom",
    "Interview",
    "Conference",
    "Course",
    "Webinar",
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center text-[clamp(2rem,4vw,3.75rem)] font-bold">
      <h1 className="">Instant</h1>
      <h1 className="ml-3">AI subtitles</h1>
      <h1 className="ml-3">
        for every{" "}
        <span
          className="bg-black text-white inline-block text-center"
          style={{ minWidth: "8ch" }}
        >
          {words[index]}
        </span>{" "}
        video,
      </h1>
    </div>
  );
};

export default RotatingTexts;
