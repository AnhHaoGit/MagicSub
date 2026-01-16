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
import { source_languages } from "@/lib/source_languages";
import SelectBox from "@/components/SelectBox";

const MainPage = () => {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [statusStep, setStatusStep] = useState("");
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [file, setFile] = useState(null);
  const [sourceLanguage, setSourceLanguage] = useState("auto");

  const handleSourceLanguageChange = (value) => {
    setSourceLanguage(value);
  };

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
    e.preventDefault();

    setLoading(true);
    setLoadingStatus("Uploading video to cloud...");

    try {
      const videoURL = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = videoURL;

      const duration = await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          resolve(video.duration);
          URL.revokeObjectURL(videoURL);
        };
        video.onerror = reject;
      });

      const title = file.name;
      const size = file.size;

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(
        process.env.NEXT_PUBLIC_RAILWAY_SERVER + "/upload-video",
        {
          method: "POST",
          body: formData,
        }
      );

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error("Problem uploading video. Please try again later.");
      }

      toast.success("Successfully uploaded video to cloud!");

      setLoadingStatus("Generating transcript...");

      const processRes = await fetch(
        process.env.NEXT_PUBLIC_RAILWAY_SERVER + "/process-video",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            cloudUrl: uploadData.cloudUrl,
            uploadKey: uploadData.key,
            title,
            size,
            duration,
            customize: session.user.style,
            sourceLanguage,
          }),
        }
      );

      const processData = await processRes.json();

      if (!processRes.ok) {
        throw new Error(processData.error || "Process failed");
      }

      toast.success("Successfully processed video!");

      const newVideo = {
        ...processData,
        title,
        size,
        duration,
        uploadKey: uploadData.key,
        cloudUrl: uploadData.cloudUrl,
        userId: session.user.id,
        customize: session.user.style,
        sourceLanguage,
      };
      add_video_to_local_storage(newVideo);
      router.push(`/main/${processData._id}`);
    } catch (err) {
      setLoading(false);
      setLoadingStatus("");
      toast.error("Problem uploading video. Please try again later.");
    } finally {
      setLoading(false);
      setLoadingStatus("");
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
              <form
                onSubmit={handleFileUpload}
                className="flex flex-col md:flex-row items-stretch sm:items-center gap-4 sm:gap-6 mt-6 sm:mt-10 bg-white/5 p-4 sm:p-6 rounded-2xl shadow-xl max-w-full"
              >
                {/* File picker */}
                <label
                  className={`flex items-center justify-center gap-2 hover:white gray rounded-full h-12 sm:h-14 px-4 sm:px-8 shadow-xl transition-colors cursor-pointer text-xs sm:text-base whitespace-nowrap w-full sm:w-auto
      ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray"}
    `}
                >
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                    disabled={loading}
                    required
                  />

                  {file ? (
                    <span className="truncate max-w-full sm:max-w-[240px]">
                      {file.name}
                    </span>
                  ) : (
                    "Choose video"
                  )}
                </label>

                {/* Language select */}
                <div className="flex flex-col justify-center w-full sm:min-w-[220px]">
                  <SelectBox
                    options={source_languages}
                    label="Source Language"
                    value={sourceLanguage}
                    onValueChange={handleSourceLanguageChange}
                    placeholder="Select Source Language"
                  />
                  <p className="gray text-[10px] mt-1">
                    Choose source language for more accurate transcription
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex items-center justify-center h-12 sm:h-14 px-6 sm:px-10 gap-2 rounded-full bg-iris text-white shadow-lg font-bold transition-colors text-sm sm:text-base whitespace-nowrap w-full sm:w-auto
      ${loading || !file ? "opacity-50 cursor-not-allowed" : "hover:bg-violet"}
    `}
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
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  {loading ? "Processing..." : "Upload Video"}
                </button>
              </form>

              {loading && (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-6 w-6 text-iris"
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  <p className="text-xs text-iris font-medium animate-pulse">
                    {loadingStatus}
                  </p>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="flex gap-2 sm:gap-3 items-center bg-iris text-white rounded-full py-3 sm:py-4 px-8 sm:px-16 md:px-20 shadow-2xl mt-6 sm:mt-10 font-bold justify-center hover:bg-violet transition-colors text-sm sm:text-base"
            >
              Login to continue
            </Link>
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
