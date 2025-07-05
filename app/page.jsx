"use client";

import LandingPageNavbar from "@/components/LandingPageNavbar";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

const LandingPage = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const handleSubmit = async (e) => {
    if (!session) {
      toast.error("Please login to download videos");
      return;
    }
    e.preventDefault();
    setLoading(true);
    console.log(url);
    const response = await fetch("/api/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    console.log(response);

    if (response.ok) {
      router.push(`/main/${data.video.publicId}`);

      console.log(data);
    } else {
      toast.error(data.message || "Download failed"); //handle sau
    }

    setLoading(false);
  };
  return (
    <>
      <LandingPageNavbar />
      <main className="flex flex-col items-center justify-center h-screen">
        <div className="flex items-center justify-center text-[clamp(2rem,4vw,3.75rem)] font-bold">
          <h1 className="">Instant</h1>
          <h1 className="ml-3 bg-black text-white">AI subtitles</h1>
          <h1 className="ml-3"> for every YouTube video,</h1>
        </div>

        <div className="flex items-center justify-center text-[clamp(2rem,4vw,3.75rem)] font-bold">
          <h1 className="">in</h1>
          <h1 className="iris ml-3">any language</h1>
        </div>

        <div className="flex items-center justify-between w-2/3 gap-6 mt-20 px-3 py-2 rounded-full shadow-[0_0_30px_rgba(76,59,207,0.3)] bg-white">
          <input
            type="text"
            placeholder="Enter YouTube video URL"
            className="ml-2 w-11/12 bg-transparent border-none outline-none text-black"
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            className="bg-iris text-white rounded-full p-4 shadow-md flex items-center justify-center hover:bg-violet transition-colors"
            onClick={handleSubmit}
          >
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
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </div>
        <button className="flex items-center gap-2 bg-iris text-white rounded-full py-4 px-20 shadow-2xl mt-10 font-bold justify-center hover:bg-violet transition-colors">
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
          {loading && <span className="ml-2">Downloading...</span>}
        </button>
      </main>
    </>
  );
};

export default LandingPage;
