const findData = async (
  setIsOwner,
  videoPath,
  setVideoData,
  setIsAccessible,
  setVideoNotFound,
  setSubtitle,
  setCustomize,
  setOriginalSubtitle,
  setOriginalCustomize,
  subtitleId,
  setSubtitleNotFound,
  isCustomization,
  setVideoUrl,
  setSummaryData,
  setOption,
  summaryId,
  setSummaryNotFound,
  isSummary,
  setCloudUrl,
  resultUrl,
  setSubbedNotFound,
  isSubbed,
) => {
  try {
    const response = await fetch("/api/find_data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ videoId: videoPath }),
    });

    if (!response.ok) {
      console.log("Access denied or error:", response.status);
      if (!isSummary && !isSubbed) {
        setVideoData(null);
      }
      setIsAccessible(false);
      setVideoNotFound(true);
      setIsOwner(false);
      return;
    }

    const data = await response.json();
    setIsOwner(data.isOwner);
    const video = data.video;

    const videoWithSubtitles = {
      ...video,
      subtitles: data.subtitles || [],
      summaries: data.summaries || [],
    };

    if (isCustomization) {
      setVideoData(video);
      const clonedSubtitle = data.subtitles.find(
        (sub) => sub._id === subtitleId,
      );

      if (clonedSubtitle) {
        setSubtitle(clonedSubtitle.subtitle);
        setOriginalSubtitle(clonedSubtitle.subtitle);
      } else {
        setSubtitleNotFound(true);
      }
      setCustomize(video.customize);
      setOriginalCustomize(video.customize);
    } else if (isSummary) {
      setVideoUrl(video.cloudUrl);
      const clonedSummary = data.summaries?.find((s) => s._id === summaryId);
      if (clonedSummary) {
        setSummaryData(clonedSummary.summary);
        setOption(clonedSummary.option || "summary");
      } else {
        setSummaryNotFound(true);
      }
    } else if (isSubbed) {
      const cloudUrls = video?.cloudUrls || [];

      const cloudUrl = cloudUrls?.find((c) => c.id === resultUrl);

      if (cloudUrl) {
        setCloudUrl(cloudUrl.url);
      } else {
        setSubbedNotFound(true);
      }
    } else {
      setVideoData(videoWithSubtitles);
      setIsAccessible(true);
    }
  } catch (error) {
    console.error("Error fetching other video data:", error);
    setVideoData(null);
    setIsAccessible(false);
    setVideoNotFound(true);
  }
};

export default findData;
