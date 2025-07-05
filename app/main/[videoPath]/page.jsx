"use client";

import React, { useEffect, useState } from "react";
import MainNavbar from "@/components/MainNavbar";
import { useParams } from "next/navigation";

export default function VideoPage() {
  const [videoLink, setVideoLink] = useState(null);
  const { videoPath } = useParams();

  useEffect(() => {

    const getVideoLink = async () => {
      try {
        console.log("Fetching for:", videoPath);
        const response = await fetch("/api/fetch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoPath }),
        });

        const data = await response.json();

        if (response.ok) {
          setVideoLink(data);
        } else {
          console.error("Fetch failed:", data);
          alert(data.message || "Get video link failed");
        }
      } catch (error) {
        console.error("Error fetching video:", error);
      }
    };

    getVideoLink();
  }, [videoPath]);

  return (
    <>
      <MainNavbar />
      <main className="flex items-center justify-center h-screen">
        <div className="p-10">
          <h1 className="text-2xl font-bold mb-4">Video Preview</h1>

          {videoLink?.cloudUrl ? (
            <video
              src={videoLink.cloudUrl}
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
