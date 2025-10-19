"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MainNavbar from "@/components/MainNavbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SuggestAFeature from "@/components/SuggestAFeature";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import fetch_data from "@/lib/fetch_data";

const SummaryPage = () => {
  const { videoId } = useParams();
  const searchParams = useSearchParams();
  const summaryId = searchParams.get("summaryId");
  const [summaryData, setSummaryData] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [option, setOption] = useState(null);
  const videoRef = useRef(null);
  const router = useRouter()
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session && status === "authenticated") {
      fetch_data(session);
    }
  }, [session, status]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session) {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!videoId || !summaryId) return;

    const videosJSON = localStorage.getItem("videos");
    if (!videosJSON) return;

    const videos = JSON.parse(videosJSON);
    const video = videos.find((v) => v._id === videoId);
    if (!video) return;

    setVideoUrl(video.cloudUrl);

    const foundSummary = video.summaries?.find((s) => s._id === summaryId);
    if (foundSummary) {
      setSummaryData(foundSummary.summary);
      setOption(foundSummary.option || "summary");
    }
  }, [videoId, summaryId]);

  if (!summaryData)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500">
        <p>Summary not found.</p>
      </div>
    );

  const { title, sections, conclusion } = summaryData;

  const formatOption = (opt) => {
    if (!opt) return "";
    return opt
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  // Hàm tua video
  const handleSeek = (timestamp) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play();
    }
  };
  const formatTimestamp = (seconds) => {
    if (typeof seconds !== "number" || isNaN(seconds)) return "00:00";

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (num) => num.toString().padStart(2, "0");

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    } else {
      return `${pad(mins)}:${pad(secs)}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />

      {/* Grid 2/3 - 1/3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-25 p-6">
        {/* Video Preview */}
        <div className="md:col-span-2 flex flex-col items-center justify-center rounded-3xl bg-black">
          {videoUrl ? (
            <video
              ref={videoRef}
              controls
              src={videoUrl}
              className="w-full rounded-xl shadow-md mb-3"
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center bg-gray-200 rounded-xl text-gray-500">
              No video preview available
            </div>
          )}
        </div>

        {/* Summary Content */}
        <Card className="overflow-y-auto max-h-[80vh] bg-white shadow-lg border border-gray-200">
          <CardHeader className="text-center space-y-2">
            <p className="text-xs iris uppercase tracking-wide font-medium">
              {formatOption(option)}
            </p>
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {sections?.length > 0 &&
              sections.map((section, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold iris mb-2">
                    {section.heading}
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {section.points.map((point, i) => (
                      <li key={i} className="text-gray-700 leading-relaxed">
                        {typeof point === "object" && point.text ? (
                          <>
                            {point.text}{" "}
                            {point.timestamp !== undefined && (
                              <Button
                                size="xs"
                                variant="outline"
                                className="ml-2 text-[10px] px-2"
                                onClick={() => handleSeek(point.timestamp)}
                              >
                                {formatTimestamp(point.timestamp)}
                              </Button>
                            )}
                          </>
                        ) : (
                          point
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

            {conclusion && (
              <div className="mt-6 border-t pt-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Conclusion
                </h4>
                <p className="text-gray-700 leading-relaxed">{conclusion}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <SuggestAFeature />
    </div>
  );
};

export default SummaryPage;
