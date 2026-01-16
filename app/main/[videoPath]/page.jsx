"use client";

import React, { useEffect, useState, useRef } from "react";
import MainNavbar from "@/components/MainNavbar";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import SubtitleOption from "@/components/OptionBox/SubtitleOption";
import SummaryOption from "@/components/OptionBox/SummaryOption";
import SubbedOption from "@/components/OptionBox/SubbedOption";
import { useRouter } from "next/navigation";
import VideoTrimmer from "@/components/VideoTrimmer";
import fetch_data from "@/lib/fetch_data";
import { toast } from "react-toastify";

export default function VideoPage() {
  const router = useRouter();
  const { videoPath } = useParams();
  const { data: session, status } = useSession();
  const [videoData, setVideoData] = useState(null);
  const [option, setOption] = useState("subtitle");
  const [loading, setLoading] = useState(false);
  const [endpoints, setEndpoints] = useState([0, 0]);
  const videoRef = useRef(null);

  useEffect(() => {
    if (session && status === "authenticated") {
      fetch_data(session);
    }
  }, [session, status]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session) {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const video = JSON.parse(localStorage.getItem("videos")) || [];
    const found = video.find((v) => v._id === videoPath);
    if (found) {
    setVideoData(found);
    setEndpoints([0, found.duration]);
    } else {
      toast.error('Cannot find this video!')
    }

  }, [videoPath]);

  return (
    <>
      <MainNavbar />
      <main className="flex flex-col items-center w-full min-h-screen pt-4 px-4 sm:pt-6 sm:px-6 md:pt-8 gap-6 md:px-8">
        <div className="flex flex-col md:flex-row w-full items-center justify-between gap-8 md:gap-5 mt-20">
          <div className="w-full md:w-2/3 h-auto md:h-[70vh] bg-black rounded-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              src={videoData?.cloudUrl}
              controls
              className="rounded-xl shadow-xl w-full h-full object-contain"
              allowFullScreen
            />
          </div>

          {/* Sidebar settings */}
          <div className="w-full md:w-1/3 h-auto md:h-[70vh] flex flex-col items-center gap-7 justify-between p-5 bg-smoke rounded-4xl shadow-lg">
            <div className="flex w-full items-center justify-center top-3 shadow-lg gap-3 sm:gap-5 bg-white p-1 rounded-4xl">
              <button
                disabled={loading}
                onClick={() => setOption("subtitle")}
                className={`w-24 sm:w-28 md:w-32 lg:w-36 flex gap-2 justify-center items-center hover:bg-zinc-200 rounded-3xl py-1 sm:py-2 md:py-3 ${
                  option === "subtitle"
                    ? "font-semibold text-black"
                    : "text-gray-700"
                }`}
              >
                {option === "subtitle" ? (
                  <div className="h-[10px] w-[10px] rounded-full bg-iris"></div>
                ) : (
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
                      d="M3.75 9h16.5m-16.5 6.75h16.5"
                    />
                  </svg>
                )}
                <span className="text-[10px] xs:text-[9px] sm:text-xs md:text-xs">
                  Subtitle
                </span>
              </button>

              <button
                disabled={loading}
                onClick={() => setOption("summary")}
                className={`w-24 sm:w-28 md:w-32 lg:w-36 flex gap-2 justify-center items-center hover:bg-zinc-200 rounded-3xl py-1 sm:py-2 md:py-3 ${
                  option === "summary"
                    ? "font-semibold text-black"
                    : "text-gray-700"
                }`}
              >
                {option === "summary" ? (
                  <div className="h-[10px] w-[10px] rounded-full bg-iris"></div>
                ) : (
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
                      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                    />
                  </svg>
                )}
                <span className="text-[10px] xs:text-[9px] sm:text-xs md:text-xs">
                  Summary
                </span>
              </button>

              <button
                disabled={loading}
                onClick={() => setOption("subbed")}
                className={`w-24 sm:w-28 md:w-32 lg:w-36 flex gap-2 justify-center items-center hover:bg-zinc-200 rounded-3xl py-1 sm:py-2 md:py-3 ${
                  option === "subbed"
                    ? "font-semibold text-black"
                    : "text-gray-700"
                }`}
              >
                {option === "subbed" ? (
                  <div className="h-[10px] w-[10px] rounded-full bg-iris"></div>
                ) : (
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
                      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                    />
                  </svg>
                )}
                <span className="text-[10px] xs:text-[9px] sm:text-xs md:text-xs">
                  Subbed
                </span>
              </button>
            </div>

            {option === "subtitle" && (
              <SubtitleOption
                videoData={videoData}
                setVideoData={setVideoData}
                session={session}
                setLoading={setLoading}
                endpoints={endpoints}
              />
            )}
            {option === "summary" && (
              <SummaryOption
                videoData={videoData}
                setVideoData={setVideoData}
                session={session}
                setLoading={setLoading}
              />
            )}
            {option === "subbed" && (
              <SubbedOption videoData={videoData} session={session} />
            )}
          </div>
        </div>

        {/* <div className="w-full bg-smoke p-5 flex flex-col gap-4 rounded-3xl shadow-lg">
          <div className="flex items-center gap-1">
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
                d="m7.848 8.25 1.536.887M7.848 8.25a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm1.536.887a2.165 2.165 0 0 1 1.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 1 1-5.196 3 3 3 0 0 1 5.196-3Zm1.536-.887a2.165 2.165 0 0 0 1.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863 2.077-1.199m0-3.328a4.323 4.323 0 0 1 2.068-1.379l5.325-1.628a4.5 4.5 0 0 1 2.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0 0 10.607 12m3.736 0 7.794 4.5-.802.215a4.5 4.5 0 0 1-2.48-.043l-5.326-1.629a4.324 4.324 0 0 1-2.068-1.379M14.343 12l-2.882 1.664"
              />
            </svg>

            <p className="text-xs">Video Trimmer</p>
            <p className="text-xs gray">(only used for subtitle option)</p>
          </div>
          <VideoTrimmer
            STEP={0.01}
            videoData={videoData}
            endpoints={endpoints}
            setEndpoints={setEndpoints}
            videoRef={videoRef}
          />
        </div> */}
      </main>
    </>
  );
}
