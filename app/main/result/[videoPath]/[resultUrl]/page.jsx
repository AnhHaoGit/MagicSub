"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import MainNavbar from "@/components/MainNavbar";
import SuggestAFeature from "@/components/SuggestAFeature";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const Page = () => {
  const [cloudUrl, setCloudUrl] = useState(null);
  const { videoPath, resultUrl } = useParams();
  const router = useRouter();

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session) {
      router.push("/login");
    }
  }, [status, router]);

  const [copied, setCopied] = useState(false);

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
      const urlObj = cloudUrls.find(
        (u) => toString(u.id) === toString(resultUrl)
      );
      const url = urlObj ? urlObj.url : null;

      setCloudUrl(url);
    } else {
      toast.error("Cannot find video data!");
    }
  }, [videoPath, resultUrl]);

  return (
    <>
      <MainNavbar />
      <main className="flex flex-col items-center justify-center mt-10 h-screen w-full p-4 sm:p-6 lg:p-10">
        {/* Video box */}
        <div className="w-full max-w-5xl flex justify-center">
          <video
            src={cloudUrl}
            controls
            className="shadow-xl w-full h-auto rounded-2xl"
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
