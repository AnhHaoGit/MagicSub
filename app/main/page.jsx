"use client";

import React, { useEffect, useState } from "react";
import MainNavbar from "@/components/MainNavbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { add_video_to_local_storage } from "@/lib/local_storage_handlers";
import SuggestAFeature from "@/components/SuggestAFeature";

const MainPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
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
            createdAt: date.toISOString()
          }),
        });

        if (!res.ok) throw new Error("Failed to get presigned URL");

        const newVideo = await res.json();

        // 2. Upload file directly to S3
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
            toast.success("Upload successful!");
            add_video_to_local_storage(newVideo);
            router.push(`/main/${newVideo._id}`);
          } else {
            toast.error("Upload failed!");
          }
          setLoading(false);
        };

        xhr.onerror = () => {
          toast.error("Upload failed (network error)!");
          setLoading(false);
        };

        xhr.send(file);
      };
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed!");
      setLoading(false);
    }
  };

  return (
    <>
      <MainNavbar />
      <main className="flex flex-col items-center justify-center h-screen">
        <div className="flex flex-col items-center w-2/3 justify-center mt-10 bg-smoke p-10 gap-10 rounded-4xl shadow-lg">
          <div className="text-center">
            <p className="font-bold text-2xl">Upload your media</p>
            <p>
              (or check your{" "}
              <Link href="/history" className="iris">
                history
              </Link>{" "}
              to see your uploaded videos)
            </p>
          </div>

          {session && status === "authenticated" ? (
            <label className="flex items-center gap-2 bg-iris text-white rounded-full py-4 px-20 shadow-2xl mt-10 font-bold justify-center hover:bg-violet transition-colors cursor-pointer">
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

          <div>
            <p className="text-xs gray">
              Download Youtube, Instagram, Tiktok videos before uploading.
            </p>
          </div>

          {loading && (
            <div className="mt-6 w-80">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-iris h-4 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-center mt-2 text-sm">
                {progress}% {eta && `(~${eta}s left)`}
              </p>
            </div>
          )}
        </div>

        <SuggestAFeature />
      </main>
    </>
  );
};

export default MainPage;
