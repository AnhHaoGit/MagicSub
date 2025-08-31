"use client";

import LandingPageNavbar from "@/components/LandingPageNavbar";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { add_video_to_local_storage } from "@/lib/local_storage_handlers";
import Link from "next/link";
import SuggestAFeature from "@/components/SuggestAFeature";

const LandingPage = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session && status === "authenticated") {
      fetchData();
    }
  }, [session, status]);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/fetch_data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      localStorage.setItem("videos", JSON.stringify(data));
      localStorage.setItem("user", JSON.stringify(session.user));
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const handleFileUpload = async (e) => {
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
      videoElement.src = URL.createObjectURL(file);

      videoElement.onloadedmetadata = async () => {
        const duration = videoElement.duration;


        const res = await fetch("/api/s3_presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            userId: session.user.id,
            title,
            size,
            duration,
          }),
        });

        if (!res.ok) throw new Error("Failed to get presigned URL");

        const newVideo = await res.json();

        // 2. Upload file trực tiếp lên S3
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", newVideo.uploadUrl, true);
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

        xhr.onload = () => {
          if (xhr.status === 200) {
            toast.success("Upload thành công!");
            add_video_to_local_storage(newVideo);
            router.push(`/main/${newVideo._id}`);
          } else {
            toast.error("Upload thất bại!");
          }
          setLoading(false);
        };

        xhr.onerror = () => {
          toast.error("Upload thất bại (network error)!");
          setLoading(false);
        };

        xhr.send(file);
      };
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload thất bại!");
      setLoading(false);
    }
  };

  return (
    <>
      <LandingPageNavbar />
      <main className="flex flex-col items-center gap-10 justify-center h-screen">
        <div>
          <div className="flex items-center justify-center text-[clamp(2rem,4vw,3.75rem)] font-bold">
            <h1 className="">Instant</h1>
            <h1 className="ml-3 bg-black text-white">AI subtitles</h1>
            <h1 className="ml-3"> for every YouTube video,</h1>
          </div>

          <div className="flex items-center justify-center text-[clamp(2rem,4vw,3.75rem)] font-bold">
            <h1 className="">in</h1>
            <h1 className="iris ml-3">any language</h1>
          </div>
        </div>

        {session && status === "authenticated" ? (
          <label className="flex gap-3 items-center bg-iris text-white rounded-full py-4 px-20 shadow-2xl mt-10 font-bold justify-center hover:bg-violet transition-colors cursor-pointer">
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
              className="size-6"
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
            className="flex gap-3 items-center bg-iris text-white rounded-full py-4 px-20 shadow-2xl mt-10 font-bold justify-center hover:bg-violet transition-colors"
          >
            Login to continue
          </Link>
        )}

        {loading && (
          <div className="mt-6 w-80">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-iris h-4 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-center mt-2 text-sm">
              {progress}% {eta && `(~${eta}s còn lại)`}
            </p>
          </div>
        )}
        <SuggestAFeature />
      </main>
    </>
  );
};

export default LandingPage;
