"use client";

import LandingPageNavbar from "@/components/LandingPageNavbar";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import {
  add_video_to_local_storage,
  update_video_in_local_storage,
} from "@/lib/local_storage_handlers";
import Link from "next/link";
import SuggestAFeature from "@/components/SuggestAFeature";
import fetch_data from "@/lib/fetch_data";

const LandingPage = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(null);
  const [canCancel, setCanCancel] = useState(false);
  const xhrRef = useRef(null);

  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session && status === "authenticated") {
      fetch_data(session);
    }
  }, [session, status]);

  const handleFileUpload = async (e) => {
    const date = new Date();
    const file = e.target.files[0];
    if (!file) return;

    if (!session) {
      toast.error("Please login to upload videos");
      return;
    }

    setLoading(true);
    setProgress(0);
    setEta(null);

    try {
      const size = file.size;
      const title = file.name;

      const videoElement = document.createElement("video");
      videoElement.preload = "metadata";
      const videoURL = URL.createObjectURL(file);
      videoElement.src = videoURL;
      window.lastVideoURL = videoURL;

      videoElement.onloadedmetadata = async () => {
        const duration = videoElement.duration;

        const presignRes = await fetch("/api/s3_presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
          }),
        });

        const { uploadUrl, fileUrl } = await presignRes.json();

        setCanCancel(true);

        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);

        let startTime = Date.now();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);

            const elapsed = (Date.now() - startTime) / 1000;
            const speed = event.loaded / elapsed;
            const remaining = (event.total - event.loaded) / speed;

            setProgress(percent);
            setEta(remaining.toFixed(1));
          }
        };

        xhr.onload = async () => {
          setCanCancel(false);
          if (xhr.status === 200) {
            const saveRes = await fetch("/api/save_video_to_db", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: session.user.id,
                cloudUrl: fileUrl,
                title,
                size,
                duration,
                createdAt: date.toISOString(),
                style: session.user.style,
              }),
            });

            const newVideo = await saveRes.json();
            add_video_to_local_storage(newVideo);

            try {
              const thumbRes = await fetch("/api/generate_thumbnail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  videoId: newVideo._id,
                  cloudUrl: newVideo.cloudUrl,
                }),
              });

              if (thumbRes.ok) {
                const { thumbnailUrl } = await thumbRes.json();
                update_video_in_local_storage(newVideo._id, thumbnailUrl);
              } else {
                console.warn("⚠️ Failed to generate thumbnail");
              }
            } catch (e) {
              console.error("Thumbnail API error:", e);
            }

            router.push(`/main/${newVideo._id}`);
            toast.success("Upload successful!");
          } else {
            toast.error("Upload failed!");
          }
          setLoading(false);
        };

        xhr.onerror = () => {
          toast.error("Upload failed (network error)!");
          setCanCancel(false);
          setLoading(false);
        };

        xhr.send(file);
      };
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed!");
      setCanCancel(false);
      setLoading(false);
    }
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }

    // Reset toàn bộ state
    setCanCancel(false);
    setLoading(false);
    setProgress(0);
    setEta(null);

    // Reset file input (rất quan trọng)
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";

    // Giải phóng URL object nếu có
    URL.revokeObjectURL(window.lastVideoURL);
    window.lastVideoURL = null;

    toast.info("Upload canceled");
  };

  return (
    <>
      <LandingPageNavbar />
      <main
        className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center 
      bg-gradient-to-b from-white via-[#f7f4ff] to-[#e4d9ff] text-black"
      >
        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-5xl leading-tight">
          👋 Wave goodbye to{" "}
          <span className="block iris  bg-clip-text text-transparent mt-2">
            “can someone explain” comments
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 text-base sm:text-sm md:text-md text-gray-700 max-w-3xl leading-relaxed">
          Powered by <span className="font-semibold iris">AI</span>, MagicSub
          turns any video into a{" "}
          <span className="font-semibold text-iris">
            multilingual experience
          </span>{" "}
          — helping <span className="font-semibold">creators</span> share their
          voice with the world and{" "}
          <span className="font-semibold">viewers</span> finally understand
          what’s going on.
        </p>

        {/* Upload Section */}
        {session && status === "authenticated" ? (
          <>
            <label className="flex gap-3 items-center bg-iris text-white rounded-full py-3 px-6 sm:py-4 sm:px-12 lg:px-20 shadow-2xl mt-10 font-bold justify-center hover:bg-violet transition-colors cursor-pointer text-sm sm:text-base">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5 sm:size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
              Upload your Video
            </label>
          </>
        ) : (
          <Link
            href="/login"
            className="flex gap-3 items-center bg-iris text-white rounded-full py-3 px-6 sm:py-4 sm:px-12 lg:px-20 shadow-2xl mt-6 font-bold justify-center hover:bg-violet transition-colors text-sm sm:text-base"
          >
            Login to continue
          </Link>
        )}

        {/* Upload Progress */}
        {loading && (
          <div className="mt-10 w-full gap-5 flex items-start max-w-xs sm:max-w-lg">
            <div className="flex flex-col items-center gap-5 w-full">
              <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4">
                <div
                  className="bg-iris h-3 sm:h-4 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-center text-xs sm:text-sm">
                {progress}% {eta && `(~${eta}s left)`}
              </p>
            </div>

            {canCancel && (
              <button
                onClick={handleCancelUpload}
                className="black text-white text-xs sm:text-sm hover:iris rounded-full transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {/* Suggest Feature */}
        <div className="mt-12">
          <SuggestAFeature />
        </div>
      </main>
    </>
  );
};

export default LandingPage;
