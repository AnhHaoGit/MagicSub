"use client";

import MainNavbar from "@/components/MainNavbar";
import { useState, useEffect } from "react";
import HistoryBox from "@/components/HistoryBox";

const Page = () => {

  const [videoData, setVideoData] = useState(null);


  useEffect(() => {
    const videos = JSON.parse(localStorage.getItem("videos")) || [];
    setVideoData(videos);
  }, []);

  return (
    <>
      <MainNavbar />
      <main className="mt-20 p-5">
        <p className="font-bold text-3xl">History</p>
        <div className="mt-10 gap-5 flex flex-col">
          {videoData && videoData.map((video) => (
            <HistoryBox key={video._id} video={video} />
          ))}
        </div>
      </main>
    </>
  );
};

export default Page;
