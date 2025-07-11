"use client";

import React, { useEffect, useState } from "react";
import MainNavbar from "@/components/MainNavbar";
import { useParams } from "next/navigation";
import { useVideo } from "@/contexts/VideoContext";

export default function VideoPage() {
  const [currentVideo, setCurrentVideo] = useState(null);
  const { videoPath } = useParams();
  const { video } = useVideo();

  console.log(video);


  useEffect(() => {
    const currentVideo = video.find((video) => video.publicId === videoPath);
    setCurrentVideo(currentVideo);
  }, [video, videoPath]);

  return (
    <>
      <MainNavbar />
      <main className="flex items-center justify-center h-screen">
        <div className="p-10">
          <h1 className="text-2xl font-bold mb-4">Video Preview</h1>

          {currentVideo?.cloudUrl ? (
            <video
              src={currentVideo.cloudUrl}
              controls
              className="w-[1000px] rounded shadow-lg"
            />
          ) : (
            <p>Loading video...</p>
          )}
        </div>
      </main>
    </>
  );
}
