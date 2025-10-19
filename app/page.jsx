"use client";

import LandingPageNavbar from "@/components/LandingPageNavbar";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import {
  add_video_to_local_storage,
  update_video_in_local_storage,
} from "@/lib/local_storage_handlers";
import Link from "next/link";
import SuggestAFeature from "@/components/SuggestAFeature";
import RotatingTexts from "@/components/RotatingTexts";
import fetch_data from "@/lib/fetch_data";

const LandingPage = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session && status === "authenticated") {
      fetch_data(session);
    }
  }, [session, status]);
  // const [youtubeUrl, setYoutubeUrl] = useState("");

  // const handleChange = (e) => {
  //   setYoutubeUrl(e.target.value);
  // };

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
            createdAt: date.toISOString(),
            style: session.user.style,
          }),
        });

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

        xhr.onload = async () => {
          if (xhr.status === 200) {
            toast.success("Upload successful!");
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

  // const handleYoutubeUpload = async () => {
  //   if (!youtubeUrl) {
  //     toast.error("Please enter a YouTube URL");
  //     return;
  //   }

  //   if (!session) {
  //     toast.error("Please login to upload videos");
  //     return;
  //   }

  //   setLoading(true);
  //   setProgress(0);
  //   setEta(null);

  //   const date = new Date();

  //   try {
  //     const res = await fetch("/api/youtube_upload", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         youtubeUrl: youtubeUrl,
  //         userId: session.user.id,
  //         createdAt: date.toISOString(),
  //         style: session.user.style,
  //       }),
  //     });

  //     if (!res.ok) {
  //       const error = await res.json();
  //       toast.error(error.error || "Failed to process YouTube video");
  //       setLoading(false);
  //       return;
  //     }

  //     const newVideo = await res.json();

  //     // ✅ Nếu server đang tải và upload video từ YouTube (quá trình lâu)
  //     // em có thể poll API để cập nhật tiến trình
  //     // ở đây anh giả định backend xử lý nhanh
  //     toast.success("YouTube video uploaded successfully!");

  //     // Cập nhật local storage
  //     add_video_to_local_storage(newVideo);

  //     // Tạo thumbnail cho video
  //     try {
  //       const thumbRes = await fetch("/api/generate_thumbnail", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           videoId: newVideo._id,
  //           cloudUrl: newVideo.cloudUrl,
  //         }),
  //       });

  //       if (thumbRes.ok) {
  //         const { thumbnailUrl } = await thumbRes.json();
  //         update_video_in_local_storage(newVideo._id, thumbnailUrl);
  //       } else {
  //         console.warn("⚠️ Failed to generate thumbnail");
  //       }
  //     } catch (e) {
  //       console.error("Thumbnail API error:", e);
  //     }

  //     // Chuyển đến trang video
  //     router.push(`/main/${newVideo._id}`);
  //   } catch (err) {
  //     console.error("YouTube upload error:", err);
  //     toast.error("Upload failed!");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <>
      <LandingPageNavbar />
      <main className="flex flex-col items-center gap-6 justify-center min-h-screen px-4 text-center">
        <div>
          <RotatingTexts />

          <div
            className="flex flex-col sm:flex-row items-center justify-center font-bold mt-4 
  text-lg sm:text-3xl md:text-4xl lg:text-5xl"
          >
            <h1 className="">in</h1>
            <h1 className="iris sm:ml-3 mt-2 sm:mt-0">any language</h1>
          </div>
        </div>

        {session && status === "authenticated" ? (
          <>
            {/* <div className="bg-white flex items-center p-3 w-8/10 justify-between mt-10 shadow-2xl rounded-4xl">
              <input
                type="text"
                placeholder="Enter Youtube video URL"
                className="w-9/10 border-none outline-none p-2 rounded-4xl"
                onChange={handleChange}
              />
              <button
                onClick={handleYoutubeUpload}
                className="flex w-10 h-10 white items-center justify-center bg-iris hover:bg-violet p-3 rounded-full"
              >
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
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </button>
            </div> */}
            <label className="flex gap-3 items-center bg-iris text-white rounded-full py-3 px-6 sm:py-4 sm:px-12 lg:px-20 shadow-2xl mt-6 font-bold justify-center hover:bg-violet transition-colors cursor-pointer text-sm sm:text-base">
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
            <p className="text-xs gray max-w-xs sm:max-w-md mt-2">
              Download Youtube, Instagram, Tiktok videos before uploading.
            </p>
          </>
        ) : (
          <Link
            href="/login"
            className="flex gap-3 items-center bg-iris text-white rounded-full py-3 px-6 sm:py-4 sm:px-12 lg:px-20 shadow-2xl mt-6 font-bold justify-center hover:bg-violet transition-colors text-sm sm:text-base"
          >
            Login to continue
          </Link>
        )}

        {loading && (
          <div className="mt-6 w-full max-w-xs sm:max-w-md">
            <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4">
              <div
                className="bg-iris h-3 sm:h-4 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-center mt-2 text-xs sm:text-sm">
              {progress}% {eta && `(~${eta}s left)`}
            </p>
          </div>
        )}
        <div className="mt-6 w-full flex justify-center">
          <SuggestAFeature />
        </div>
      </main>
    </>
  );
};

export default LandingPage;
