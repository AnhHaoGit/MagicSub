"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import MainNavbar from "@/components/MainNavbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SummaryPage = () => {
  const { videoId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const summaryId = searchParams.get("summaryId");

  const [summaryData, setSummaryData] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoTitle, setVideoTitle] = useState("");

  useEffect(() => {
    if (!videoId || !summaryId) return;

    const videosJSON = localStorage.getItem("videos");
    if (!videosJSON) return;

    const videos = JSON.parse(videosJSON);
    const video = videos.find((v) => v._id === videoId);
    if (!video) return;

    setVideoUrl(video.cloudUrl);
    setVideoTitle(video.title || "Untitled Video");

    const foundSummary = video.summaries?.find((s) => s._id === summaryId);
    if (foundSummary) {
      setSummaryData(foundSummary.summary);
    }
  }, [videoId, summaryId]);

  if (!summaryData)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500">
        <p>Summary not found.</p>
        <Button onClick={() => router.push(`/main/${videoId}`)}>Back</Button>
      </div>
    );

  const { title, sections, conclusion } = summaryData;

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />

      {/* Dùng grid chia tỉ lệ 2/3 - 1/3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-25 p-6">
        {/* Video Preview (chiếm 2 cột) */}
        <div className="md:col-span-2 flex flex-col items-center">
          {videoUrl ? (
            <video
              controls
              src={videoUrl}
              className="w-full rounded-xl shadow-md mb-3"
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center bg-gray-200 rounded-xl text-gray-500">
              No video preview available
            </div>
          )}
          <p className="text-gray-700 font-semibold text-center">
            {videoTitle}
          </p>
          <Button
            onClick={() => router.push(`/main/${videoId}`)}
            className="mt-4"
          >
            Back to Video
          </Button>
        </div>

        {/* Summary Content (chiếm 1 cột) */}
        <Card className="overflow-y-auto max-h-[80vh] bg-white shadow-lg border border-gray-200">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-800 text-center">
              {title}
            </h2>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {sections?.length > 0 &&
              sections.map((section, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold text-indigo-600 mb-2">
                    {section.heading}
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {section.points.map((point, i) => (
                      <li key={i} className="text-gray-700 leading-relaxed">
                        {typeof point === "object" && point.text ? (
                          <>
                            {point.text}
                            {point.timestamp !== undefined && (
                              <span className="text-sm text-gray-500 ml-2">
                                ({point.timestamp}s)
                              </span>
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
    </div>
  );
};

export default SummaryPage;
