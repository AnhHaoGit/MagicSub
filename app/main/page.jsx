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
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");

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
        setStatusStep("Requesting cloud URL...");
        const presignRes = await fetch("/api/s3_presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
          }),
        });

        if (!presignRes.ok) {
          toast.error("Failed to get cloud URL!");
          setLoading(false);
          return;
        }

        const { uploadUrl, fileUrl, uploadKey } = await presignRes.json();
        if (!uploadUrl || !fileUrl) {
          toast.error("Error! Try again later.");
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

          const { audioUrl, audioKey } = await extractRes.json();

          if (!audioUrl || !audioKey) {
            toast.error("Audio extraction failed");
            setStatusStep("Audio extraction failed");
            setLoading(false);
            return;
          }

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

  const handleYoutubeUpload = async () => {
    const date = new Date();

    if (!youtubeUrl.trim()) {
      toast.info("Please paste a YouTube video URL first!");
      return;
    }

    try {
      // Upload video to cloud
      setYoutubeLoading(true);
      setStatusStep("Uploading video to cloud...");
      const res = await fetch("/api/upload_youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl: youtubeUrl.trim() }),
      });

      const uploadData = await res.json();
      const { fileUrl, uploadKey, audioUrl, audioKey, title, size, duration } =
        uploadData;

      if (!res.ok) {
        toast.error("Upload video failed! Try again later.");
        setStatusStep("Upload video failed! Try again later.");
        setYoutubeLoading(false);
        throw new Error(uploadData.error || "Upload failed");
      }

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

      const newVideo = await saveRes.json();

      if (!saveRes.ok) {
        toast.error("Failed to save video to database! Try again later.");
        setStatusStep("Database save failed! Try again later.");
        setLoading(false);
        throw new Error(newVideo.error || "Saving data failed");
      }

      add_video_to_local_storage(newVideo);

      // Generate thumbnail
      setStatusStep("Generating thumbnail...");
      const thumbRes = await fetch("/api/generate_thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: newVideo._id,
          cloudUrl: newVideo.cloudUrl,
        }),
      });

      const thumbData = await thumbRes.json();
      const { thumbnailUrl } = thumbData;

      if (!thumbRes.ok) {
        toast.error("Failed to generate thumbnail! Try again later.");
        setStatusStep("Generate thumbnail failed! Try again later.");
        setYoutubeLoading(false);
        throw new Error(newVideo.error || "Generate thumbnail failed!");
      }
      update_video_in_local_storage(newVideo._id, thumbnailUrl);

      setStatusStep("Upload complete!");
      router.push(`/main/${newVideo._id}`);
      toast.success("Upload successful!");

      setYoutubeLoading(false);
    } catch (err) {
      toast.error(err);
    } finally {
      setYoutubeLoading(false);
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
            <>
              <div className="flex bg-white p-2 rounded-4xl w-9/10 mt-10 gap-2">
                <input
                  type="text"
                  className="bg-white w-full text-xs py-2 pl-5 rounded-4xl border-none focus:outline-none"
                  placeholder="Paste Youtube video URL"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
                <button
                  onClick={handleYoutubeUpload}
                  disabled={youtubeLoading}
                  className={`bg-iris rounded-full flex items-center justify-center p-3 ${
                    youtubeLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {youtubeLoading ? (
                    <svg
                      className="animate-spin h-6 w-6 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6 text-white"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                      />
                    </svg>
                  )}
                </button>
              </div>
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
            </>
          ) : (
            <Link
              href="/login"
              className="flex gap-2 sm:gap-3 items-center bg-iris text-white rounded-full py-3 sm:py-4 px-8 sm:px-16 md:px-20 shadow-2xl mt-6 sm:mt-10 font-bold justify-center hover:bg-violet transition-colors text-sm sm:text-base"
            >
              Login to continue
            </Link>
          )}

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

          {youtubeLoading && statusStep && (
            <p className="mt-10 text-xs text-iris font-medium animate-pulse">
              {statusStep}
            </p>
          )}
        </div>

        <SuggestAFeature />
      </main>
    </>
  );
};

export default MainPage;
