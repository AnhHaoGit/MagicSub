const findData = async (videoPath, setVideoData, setIsAccessible) => {
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
      setVideoData(null);
      setIsAccessible(false);
      localStorage.removeItem("sharing");
      return;
    }

    const data = await response.json();

    const videoWithSubtitles = {
      ...data.video,
      subtitles: data.subtitles || [],
      summaries: data.summaries || [],
    };


    localStorage.setItem("sharing", JSON.stringify(videoWithSubtitles));

    setVideoData(videoWithSubtitles);
    setIsAccessible(true);
  } catch (error) {
    console.error("Error fetching other video data:", error);
    setVideoData(null);
    setIsAccessible(false);
  }
};

export default findData;
