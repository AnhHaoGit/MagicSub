"use client";

import React, { useEffect, useState } from "react";
import MainNavbar from "@/components/MainNavbar";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import SubtitleOption from "@/components/SubtileOption";
import SummaryOption from "@/components/SummaryOption";
import QuizzesOption from "@/components/QuizzesOption";
import { useRouter } from "next/navigation";
import SuggestAFeature from "@/components/SuggestAFeature";

export default function VideoPage() {
  const router = useRouter();
  const { videoPath } = useParams();
  const { data: session, status } = useSession();
  const [videoData, setVideoData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [option, setOption] = useState("subtitle");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session) {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const video = JSON.parse(localStorage.getItem("videos")) || [];
    const found = video.find((v) => v._id === videoPath);
    setVideoData(found);
  }, [videoPath]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")) || [];
    setUserData(user);
  }, []);

  return (
    <>
      <MainNavbar />
      <main className="flex flex-col items-center w-full min-h-screen p-4 sm:p-6 md:p-10">
        <div className="flex flex-col md:flex-row w-full items-center justify-between gap-8 md:gap-5 mt-20">
          {/* Video player */}
          <div className="w-full md:w-2/3 h-auto md:h-[70vh] bg-black rounded-2xl flex items-center justify-center">
            <video
              src={videoData?.cloudUrl}
              controls
              className="rounded-xl shadow-xl w-full h-full object-contain"
              allowFullScreen
            />
          </div>

          {/* Sidebar settings */}
          <div className="w-full md:w-1/3 h-auto md:h-[70vh] flex flex-col items-center justify-between p-5 bg-smoke rounded-4xl shadow-lg">
            <div className="flex items-center justify-center top-3 shadow-lg gap-3 sm:gap-5 bg-white p-2 rounded-4xl">
              <button
                onClick={() => setOption("subtitle")}
                className={`w-24 gap-2 sm:w-30 flex justify-center items-center sm:text-base black hover:bg-zinc-200 rounded-2xl py-1`}
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

                <span className="text-xs">Subtitle</span>
              </button>
              <button
                onClick={() => setOption("summary")}
                className={`w-24 gap-2 sm:w-30 flex justify-center items-center sm:text-base black hover:bg-zinc-200 rounded-2xl py-1`}
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
                <span className="text-xs">Summary</span>
              </button>
              <button
                onClick={() => setOption("quizzes")}
                className={`w-24 gap-2 sm:w-30 flex justify-center items-center sm:text-base black hover:bg-zinc-200 rounded-2xl py-1`}
              >
                {option === "quizzes" ? (
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
                      d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                )}
                <span className="text-xs">Quizzes</span>
              </button>
            </div>
            {option === "subtitle" && (
              <SubtitleOption videoData={videoData} session={session} />
            )}
            {option === "summary" && (
              <SummaryOption videoData={videoData} session={session} />
            )}
            {option === "quizzes" && (
              <QuizzesOption videoData={videoData} session={session} />
            )}
          </div>
        </div>

        <SuggestAFeature />
      </main>
    </>
  );
}
