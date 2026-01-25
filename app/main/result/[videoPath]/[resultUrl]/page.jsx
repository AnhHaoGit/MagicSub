"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import MainNavbar from "@/components/MainNavbar";
import SuggestAFeature from "@/components/SuggestAFeature";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import fetch_data from "@/lib/fetch_data";
import findData from "@/lib/find_data";

const Page = () => {
  const [cloudUrl, setCloudUrl] = useState(null);
  const { videoPath, resultUrl } = useParams();
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAccessible, setIsAccessible] = useState(true);
  const [videoNotFound, setVideoNotFound] = useState(false);
  const [subbedNotFound, setSubbedNotFound] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

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

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // tự tắt sau 2s
  };

  useEffect(() => {
    const videos = JSON.parse(localStorage.getItem("videos")) || [];
    const found = videos.find((v) => v._id === videoPath);

    if (found) {
      const cloudUrls = found?.cloudUrls || [];

      for (let i = 0; i < cloudUrls.length; i++) {
        const urlObj = cloudUrls[i];
        if (toString(urlObj.id) === toString(resultUrl)) {
          setCloudUrl(urlObj.url);
        }
      }
    } else {
      findData(
        setIsOwner,
        videoPath,
        null,
        setIsAccessible,
        setVideoNotFound,
        null,
        null,
        null,
        null,
        null,
        null,
        false,
        null,
        null,
        null,
        null,
        null,
        false,
        setCloudUrl,
        resultUrl,
        setSubbedNotFound,
        true,
      );
    }
  }, [videoPath, resultUrl]);

  if (!isAccessible) {
    return (
      <>
        <main className="flex items-center justify-center h-screen">
          <p className="text-lg text-gray-600">
            You cannot access this content.
          </p>
        </main>
      </>
    );
  }
  if (videoNotFound) {
    return (
      <>
        <main className="flex items-center justify-center h-screen">
          <p className="text-lg text-gray-600">Video not found.</p>
        </main>
      </>
    );
  }

  if (subbedNotFound) {
    return (
      <>
        <main className="flex items-center justify-center h-screen">
          <p className="text-lg text-gray-600">Video not found.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <MainNavbar />
      <main className="flex flex-col items-center justify-center h-screen w-full p-30">
        {/* Video box */}
        <div className="w-full max-w-5xl h-9/10 flex bg-black justify-center rounded-2xl shadow-xl">
          <video
            src={cloudUrl}
            controls
            className="shadow-xl w-full max-h-full rounded-2xl"
          />
        </div>

        {/* Copy button */}
        <button
          className="flex items-center justify-center gap-2 py-2 px-6 sm:px-10 rounded-4xl text-xs sm:text-sm transition-colors bg-iris font-semibold white hover:bg-violet mt-6 sm:mt-10"
          onClick={() => handleCopyLink(cloudUrl)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-4 sm:size-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
            />
          </svg>
          <span>{copied ? "Copied!" : "Copy Link"}</span>
        </button>

        {/* Suggest feature */}
        <div className="w-full max-w-3xl mt-6 sm:mt-10">
          <SuggestAFeature />
        </div>
      </main>
    </>
  );
};

export default Page;
