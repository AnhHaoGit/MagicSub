"use client";

import React, { useEffect, useState } from "react";
import MainNavbar from "@/components/MainNavbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  add_video_to_local_storage,
  update_video_in_local_storage,
} from "@/lib/local_storage_handlers";
import SuggestAFeature from "@/components/SuggestAFeature";
import fetch_data from "@/lib/fetch_data";
import { useRef } from "react";

const MainPage = () => {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(null);
  const [canCancel, setCanCancel] = useState(false);
  const xhrRef = useRef(null);
  const [statusStep, setStatusStep] = useState("");

  useEffect(() => {
    if (session && status === "authenticated") {
      fetch_data(session);
    }
  }, [session, status]);
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session) {
      router.push("/login");
    }
  }, [status, router]);

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
    setStatusStep("Initializing upload...");

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

        // API presigned URL
        setStatusStep("Requesting presigned URL...");
        const presignRes = await fetch("/api/s3_presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
          }),
        });

        if (!presignRes.ok) {
          toast.error("Failed to get presigned URL!");
          setStatusStep("Presign failed");
          setLoading(false);
          return;
        }

        const { uploadUrl, fileUrl, uploadKey } = await presignRes.json();
        if (!uploadUrl || !fileUrl) {
          toast.error("Invalid presign response!");
          setStatusStep("Presign response invalid");
          setLoading(false);
          return;
        }

        // Upload file
        setStatusStep("Uploading video to cloud...");
        setCanCancel(true);

        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);

        const startTime = Date.now();

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

          if (xhr.status !== 200) {
            toast.error("Upload failed!");
            setStatusStep("Upload failed!");
            setLoading(false);
            return;
          }

          // API extract audio
          setStatusStep("Extracting audio...");
          let audioUrl = null;
          let audioKey = null;

          const extractRes = await fetch("/api/extract_audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileUrl }),
          });

          if (!extractRes.ok) {
            toast.error("Failed to extract audio!");
            setStatusStep("Audio extraction failed");
            setLoading(false);
            return;
          }

          const data = await extractRes.json();
          if (!data.audioUrl || !data.audioKey) {
            toast.error("Audio extraction response invalid!");
            setStatusStep("Audio extraction failed");
            setLoading(false);
            return;
          }

          audioUrl = data.audioUrl;
          audioKey = data.audioKey;

          // Save data to DB
          setStatusStep("Saving data to database...");
          const saveRes = await fetch("/api/save_video_to_db", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: session.user.id,
              cloudUrl: fileUrl,
              audioUrl,
              title,
              size,
              duration,
              createdAt: date.toISOString(),
              style: session.user.style,
              audioKey,
              uploadKey,
            }),
          });

          if (!saveRes.ok) {
            toast.error("Failed to save video to database!");
            setStatusStep("Database save failed");
            setLoading(false);
            return;
          }

          const newVideo = await saveRes.json();
          add_video_to_local_storage(newVideo);

          // Generate thumbnail
          setStatusStep("Generating thumbnail...");
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
              console.warn("Failed to generate thumbnail");
            }
          } catch (e) {
            console.error("Thumbnail API error:", e);
          }

          setStatusStep("Upload complete!");
          router.push(`/main/${newVideo._id}`);
          toast.success("Upload successful!");
          setLoading(false);
        };

        xhr.onerror = () => {
          toast.error("Upload failed (network error)!");
          setStatusStep("Upload failed (network error)");
          setCanCancel(false);
          setLoading(false);
        };

        xhr.send(file);
      };
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed!");
      setStatusStep("Unexpected error");
      setCanCancel(false);
      setLoading(false);
    }
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
      setCanCancel(false);
      setLoading(false);
      setProgress(0);
      setEta(null);
      toast.info("Upload canceled");
    }
  };

  return (
    <>
      <MainNavbar />
      <main className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center w-full max-w-4xl justify-center mt-10 bg-smoke p-6 sm:p-8 md:p-10 gap-8 sm:gap-10 rounded-3xl shadow-lg">
          <div className="text-center">
            <p className="font-bold text-xl sm:text-2xl md:text-3xl">
              Upload your media
            </p>
            <p className="text-sm sm:text-base mt-2">
              (or check your{" "}
              <Link href="/history" className="iris underline">
                history
              </Link>{" "}
              to see your uploaded videos)
            </p>
          </div>

          {session && status === "authenticated" ? (
            <label className="flex items-center gap-2 bg-iris text-white rounded-full py-3 sm:py-4 px-8 sm:px-16 md:px-20 shadow-2xl mt-6 sm:mt-10 font-bold justify-center hover:bg-violet transition-colors cursor-pointer text-sm sm:text-base">
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
          ) : (
            <Link
              href="/login"
              className="flex gap-2 sm:gap-3 items-center bg-iris text-white rounded-full py-3 sm:py-4 px-8 sm:px-16 md:px-20 shadow-2xl mt-6 sm:mt-10 font-bold justify-center hover:bg-violet transition-colors text-sm sm:text-base"
            >
              Login to continue
            </Link>
          )}

          <div>
            <p className="text-xs sm:text-sm gray text-center px-2">
              Download Youtube, Instagram, Tiktok videos before uploading.
            </p>
          </div>

          {loading && (
            <div className="mt-6 w-full gap-5 flex items-start max-w-xs sm:max-w-lg">
              <div className="flex flex-col items-center gap-5 w-full">
                <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4">
                  <div
                    className="bg-iris h-3 sm:h-4 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-center text-xs sm:text-sm">
                    {progress}% {eta && `(~${eta}s left)`}
                  </p>
                  {statusStep && (
                    <p className="text-xs text-iris font-medium animate-pulse">
                      {statusStep}
                    </p>
                  )}
                </div>
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
        </div>

        <SuggestAFeature />
      </main>
    </>
  );
};

export default MainPage;
