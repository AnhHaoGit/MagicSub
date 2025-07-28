const add_video_to_local_storage = (video) => {
  let videos = JSON.parse(localStorage.getItem("videos"));
  if (!videos) videos = []
  videos.push(video);
  localStorage.setItem("videos", JSON.stringify(videos));
};

const update_video_in_local_storage = (updatedVideo) => {
  const videos = JSON.parse(localStorage.getItem("videos"));
  const videoIndex = videos.findIndex(
    (video) => video._id === updatedVideo._id
  );
  videos[videoIndex] = updatedVideo;
  localStorage.setItem("videos", JSON.stringify(videos));
};

const add_subtitle_to_local_storage_by_video_id = (videoId, subtitle, subtitleId, customize) => {
  const videosJSON = localStorage.getItem("videos");
  if (!videosJSON) return;

  const videos = JSON.parse(videosJSON);

  const updatedVideos = videos.map((video) => {
    if (video._id === videoId) {
      return {
        ...video,
        subtitle,
        subtitleId,
        customize
      };
    }
    return video;
  });

  localStorage.setItem("videos", JSON.stringify(updatedVideos));
};

export { add_video_to_local_storage, update_video_in_local_storage, add_subtitle_to_local_storage_by_video_id };
