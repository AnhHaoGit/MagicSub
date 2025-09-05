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
    <div className="flex flex-col sm:flex-row items-center justify-center font-bold text-lg sm:text-3xl md:text-4xl lg:text-5xl text-center">
      <h1 className="">Instant</h1>
      <h1 className="sm:ml-3 mt-2 sm:mt-0">AI subtitles</h1>
      <h1 className="sm:ml-3 mt-2 sm:mt-0">
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
