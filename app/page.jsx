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
import DemoBox from "@/components/DemoBox";

const demoVideos = [
  {
    src: "https://magicsub-storage.s3.ap-southeast-2.amazonaws.com/hard_subbed_demo_english.mp4",
  },
  {
    src: "https://magicsub-storage.s3.ap-southeast-2.amazonaws.com/hard_subbed_demo_korean.mp4",
  },
  {
    src: "https://magicsub-storage.s3.ap-southeast-2.amazonaws.com/hard_subbed_demo_russian.mp4",
  },
];

const LandingPage = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(null);
  const [canCancel, setCanCancel] = useState(false);
  const xhrRef = useRef(null);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [statusStep, setStatusStep] = useState("");

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

        setStatusStep("Requesting presigned URL...");
        const presignRes = await fetch("/api/s3_presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
          }),
        });

        const { uploadUrl, fileUrl } = await presignRes.json();
        setStatusStep("Uploading video to cloud...");

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
            setStatusStep("Extracting audio...");
            let audioUrl = null;

            try {
              const extractRes = await fetch("/api/extract_audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileUrl }),
              });

              if (extractRes.ok) {
                const data = await extractRes.json();
                audioUrl = data.audioUrl;
              } else {
                toast.error("Failed to extract audio");
              }
            } catch (err) {
              toast.error("Audio extraction error:", err);
            }

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
              }),
            });

            const newVideo = await saveRes.json();
            add_video_to_local_storage(newVideo);

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
                console.warn("⚠️ Failed to generate thumbnail");
              }
            } catch (e) {
              console.error("Thumbnail API error:", e);
            }

            setStatusStep("Upload complete!");
            router.push(`/main/${newVideo._id}`);
            toast.success("Upload successful!");
          } else {
            toast.error("Upload failed!");
            setStatusStep("Upload failed!");
          }
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
    }

    setCanCancel(false);
    setLoading(false);
    setProgress(0);
    setEta(null);

    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";

    URL.revokeObjectURL(window.lastVideoURL);
    window.lastVideoURL = null;

    toast.info("Upload canceled");
  };

  return (
    <>
      <LandingPageNavbar />
      <main
        className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center 
      bg-gradient-to-b from-white via-white to-[#836fff] text-black"
      >
        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-5xl leading-tight">
          👋 Wave goodbye to{" "}
          <span className="block iris bg-clip-text text-transparent mt-2">
            “can someone explain” comments
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 text-base sm:text-sm md:text-md text-gray-700 max-w-3xl leading-relaxed">
          Powered by <span className="font-semibold">AI</span>, MagicSub turns
          any video into a{" "}
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

              {statusStep && (
                <p className="text-sm text-iris font-medium animate-pulse mt-2">
                  {statusStep}
                </p>
              )}
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

      {/* ===== Preview Section ===== */}
      <section className="flex flex-col w-full lg:flex-row items-center justify-center gap-14 px-6 py-20 text-black">
        <div className="max-w-xl w-1/3 lg:ml-20">
          <h2 className="text-3xl sm:text-4xl w-full block font-extrabold black mb-6 text-center">
            🎥 See MagicSub in Action
          </h2>
          <p className="gray hidden lg:inline-block text-base sm:text-md leading-relaxed mb-4 text-center">
            Watch how MagicSub automatically generates multilingual subtitles
            and lets you customize them with just a few clicks.
          </p>
          <p className="gray hidden lg:inline-block text-base sm:text-md leading-relaxed text-center">
            Experience the power of AI subtitles — precise, fast, and
            beautifully styled for your content.
          </p>
        </div>

        <div className="w-2/3 flex justify-center">
          <video
            controls
            className="w-full sm:w-4/5 lg:w-[80%] rounded-[2rem] shadow-2xl border border-gray-200"
            src="https://magicsub-storage.s3.ap-southeast-2.amazonaws.com/preview.mp4"
            autoPlay
            loop
            muted
            playsInline
          ></video>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20 bg-violet">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold white text-gray-900 mb-12">
            ✨ Discover the outstanding features of MagicSub
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 1️⃣ Fast and accurate subtitle creation */}
            <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-start gap-6 hover:-translate-y-1 hover:shadow-xl transition-all">
              <div className="bg-smoke p-2 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-10 iris"
                >
                  <path
                    fillRule="evenodd"
                    d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold text-left mb-2">
                  Fast and Accurate
                </h3>
                <p className="text-gray-600 text-left text-sm">
                  MagicSub uses AI to automatically generate subtitles in
                  seconds, ensuring high accuracy and perfect synchronization
                  with your video.
                </p>
              </div>
            </div>

            {/* 2️⃣ Multilingual Transcription & Translation */}
            <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-start gap-6 hover:-translate-y-1 hover:shadow-xl transition-all">
              <div className="bg-smoke p-2 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-10 iris"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2.25a.75.75 0 0 1 .75.75v1.506a49.384 49.384 0 0 1 5.343.371.75.75 0 1 1-.186 1.489c-.66-.083-1.323-.151-1.99-.206a18.67 18.67 0 0 1-2.97 6.323c.318.384.65.753 1 1.107a.75.75 0 0 1-1.07 1.052A18.902 18.902 0 0 1 9 13.687a18.823 18.823 0 0 1-5.656 4.482.75.75 0 0 1-.688-1.333 17.323 17.323 0 0 0 5.396-4.353A18.72 18.72 0 0 1 5.89 8.598a.75.75 0 0 1 1.388-.568A17.21 17.21 0 0 0 9 11.224a17.168 17.168 0 0 0 2.391-5.165 48.04 48.04 0 0 0-8.298.307.75.75 0 0 1-.186-1.489 49.159 49.159 0 0 1 5.343-.371V3A.75.75 0 0 1 9 2.25ZM15.75 9a.75.75 0 0 1 .68.433l5.25 11.25a.75.75 0 1 1-1.36.634l-1.198-2.567h-6.744l-1.198 2.567a.75.75 0 0 1-1.36-.634l5.25-11.25A.75.75 0 0 1 15.75 9Zm-2.672 8.25h5.344l-2.672-5.726-2.672 5.726Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold text-left mb-2">
                  Multilingual
                </h3>
                <p className="text-gray-600 text-left text-sm">
                  Supports speech recognition in over 50 languages and can
                  translate subtitles into most major languages worldwide.
                </p>
              </div>
            </div>

            {/* 3️⃣ Subtitle customization & styling */}
            <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-start gap-6 hover:-translate-y-1 hover:shadow-xl transition-all">
              <div className="bg-smoke p-2 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-10 iris"
                >
                  <path
                    fillRule="evenodd"
                    d="M20.599 1.5c-.376 0-.743.111-1.055.32l-5.08 3.385a18.747 18.747 0 0 0-3.471 2.987 10.04 10.04 0 0 1 4.815 4.815 18.748 18.748 0 0 0 2.987-3.472l3.386-5.079A1.902 1.902 0 0 0 20.599 1.5Zm-8.3 14.025a18.76 18.76 0 0 0 1.896-1.207 8.026 8.026 0 0 0-4.513-4.513A18.75 18.75 0 0 0 8.475 11.7l-.278.5a5.26 5.26 0 0 1 3.601 3.602l.502-.278ZM6.75 13.5A3.75 3.75 0 0 0 3 17.25a1.5 1.5 0 0 1-1.601 1.497.75.75 0 0 0-.7 1.123 5.25 5.25 0 0 0 9.8-2.62 3.75 3.75 0 0 0-3.75-3.75Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold text-left mb-2">
                  Subtitle customization
                </h3>
                <p className="text-gray-600 text-left text-sm">
                  Choose your font, color, size, position, and background to
                  make subtitles look great and match your brand’s style.
                </p>
              </div>
            </div>

            {/* 4️⃣ Hardcode subtitles */}
            <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-start gap-6 hover:-translate-y-1 hover:shadow-xl transition-all">
              <div className="bg-smoke p-2 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-10 iris"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold text-left mb-2">
                  Hardcode subtitles
                </h3>
                <p className="text-gray-600 text-left text-sm">
                  Create a complete video with embedded subtitles — perfect for
                  sharing and displaying on any platform.
                </p>
              </div>
            </div>

            {/* 5️⃣ Easy video sharing */}
            <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-start gap-6 hover:-translate-y-1 hover:shadow-xl transition-all">
              <div className="bg-smoke p-2 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-10 iris"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold text-left mb-2">
                  Easy video sharing
                </h3>
                <p className="text-gray-600 text-left text-sm">
                  Get a direct link or download your video to share instantly
                  with friends, your community, or on social media — all in one
                  click.
                </p>
              </div>
            </div>

            {/* 6️⃣ Video content summarization */}
            <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-start gap-6 hover:-translate-y-1 hover:shadow-xl transition-all">
              <div className="bg-smoke p-2 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-10 iris"
                >
                  <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
                  <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold text-left mb-2">
                  Video content summarization
                </h3>
                <p className="text-gray-600 text-left text-sm">
                  MagicSub’s AI automatically analyzes and summarizes your
                  video, helping you grasp the key ideas in just a few lines.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Demo Section ===== */}
      <section className="mt-20 flex flex-col items-center justify-center gap-5 px-6 text-center text-black">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
          Try the Interactive Demo
        </h2>

        <div className="w-full">
          <DemoBox />
        </div>
      </section>

      <section className="w-full flex flex-col items-center justify-between mt-20 gap-20 pb-20">
        {/* === 1️⃣ Video Trimmer === */}
        <div className="flex flex-col md:flex-row bg-violet rounded-3xl p-6 sm:p-10 w-[90%] md:w-2/3 items-center gap-8 md:gap-10 md:self-start md:ml-40">
          <div className="w-full md:w-1/3 flex flex-col text-left">
            <p className="font-semibold text-2xl sm:text-3xl text-white mb-3">
              Video Trimmer
            </p>
            <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
              Easily trim, cut, and focus on the best moments of your video —
              all within seconds.
            </p>
          </div>
          <div className="w-full md:w-2/3">
            <video
              className="w-full rounded-2xl"
              autoPlay
              loop
              muted
              playsInline
              src="https://magicsub-storage.s3.ap-southeast-2.amazonaws.com/video_trimmer.mp4"
            ></video>
          </div>
        </div>

        {/* === 2️⃣ Unlimited Storage === */}
        <div className="flex flex-col-reverse md:flex-row bg-violet rounded-3xl p-6 sm:p-10 w-[90%] md:w-2/3 items-center gap-8 md:gap-10 md:self-end md:mr-40">
          <div className="w-full md:w-2/3">
            <img
              src="https://magicsub-storage.s3.ap-southeast-2.amazonaws.com/unlimited_storage.png"
              alt="Unlimited Storage"
              className="rounded-2xl w-full"
            />
          </div>
          <div className="w-full md:w-1/3 flex flex-col text-left md:text-right">
            <p className="font-semibold text-2xl sm:text-3xl text-white mb-3">
              Unlimited Storage
            </p>
            <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
              Store all your projects securely in the cloud with no size
              limitations.
            </p>
          </div>
        </div>

        {/* === 3️⃣ AI-powered language detection === */}
        <div className="flex flex-col md:flex-row bg-violet rounded-3xl p-6 sm:p-10 w-[90%] md:w-2/3 items-center gap-8 md:gap-10 md:self-start md:ml-40">
          <div className="w-full md:w-1/3 flex flex-col text-left">
            <p className="font-semibold text-2xl sm:text-3xl text-white mb-3">
              AI-powered language detection
            </p>
            <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
              Instantly detect the spoken language in your video and auto-set
              the correct transcription.
            </p>
          </div>
          <div className="w-full md:w-2/3">
            <video
              className="w-full rounded-2xl"
              autoPlay
              loop
              muted
              playsInline
              src="https://magicsub-storage.s3.ap-southeast-2.amazonaws.com/ai_powered_language+detection.mp4"
            ></video>
          </div>
        </div>
      </section>

      {/* === Demo Videos Carousel === */}
      <section className="flex flex-col items-center justify-center w-full py-20 bg-gradient-to-b from-white to-violet/10">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-10">
          🎬 Hard-Subbed Videos
        </h2>

        {/* === Carousel Container === */}
        <div className="w-full flex items-center justify-center gap-5">
          {/* === Left Button === */}
          <button
            onClick={() =>
              setCurrentVideo((prev) =>
                prev === 0 ? demoVideos.length - 1 : prev - 1
              )
            }
            className="z-10 bg-white rounded-full shadow-lg hover:bg-gray-100 p-3 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-gray-700"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>

          {/* === Video Display === */}
          <div className="overflow-hidden rounded-3xl h-[700px] bg-black border border-gray-200 w-[85%] shadow-[0_0_25px_5px_rgba(131,111,255,0.6)]">
            <video
              key={demoVideos[currentVideo].src}
              src={demoVideos[currentVideo].src}
              className="w-full rounded-3xl"
              controls
            ></video>
          </div>

          {/* === Right Button === */}
          <button
            onClick={() =>
              setCurrentVideo((prev) =>
                prev === demoVideos.length - 1 ? 0 : prev + 1
              )
            }
            className="z-10 bg-white rounded-full shadow-lg hover:bg-gray-100 p-3 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-gray-700"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      </section>
    </>
  );
};

export default LandingPage;
