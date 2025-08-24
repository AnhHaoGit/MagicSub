"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MainNavbar from "@/components/MainNavbar";

const Page = () => {
  const [videoData, setVideoData] = useState(null);
  const { videoPath } = useParams();

  useEffect(() => {
    const video = JSON.parse(localStorage.getItem("videos")) || [];
    const found = video.find((v) => v._id === videoPath);
    if (found) {
      setVideoData(found);
    } else {
      toast.error("Cannot find video data!");
    }
  }, [videoPath]);

  console.log(videoData);

  return (
    <>
      <MainNavbar />
      <main className="flex flex-col items-center justify-center min-h-screen w-full">
        <div>
          <video
            src={videoData?.cloudUrls[0].url}
            controls
            className="shadow-xl w-full"
          />
        </div>
      </main>
    </>
  );
};

export default Page;
