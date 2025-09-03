const add_video_to_local_storage = (video) => {
  let videos = JSON.parse(localStorage.getItem("videos"));
  if (!videos) videos = [];
  videos.push(video);
  localStorage.setItem("videos", JSON.stringify(videos));
};

const update_video_in_local_storage = (videoId, thumbnailUrl) => {
  const videos = JSON.parse(localStorage.getItem("videos")) || [];
  const videoIndex = videos.findIndex((video) => video._id === videoId);

  if (videoIndex !== -1) {
    videos[videoIndex].thumbnailUrl = thumbnailUrl; // cập nhật/chèn thumbnailUrl mới
    localStorage.setItem("videos", JSON.stringify(videos));
  }
};


const add_subtitle_to_local_storage_by_video_id = (
  videoId,
  subtitle,
  subtitleId,
  customize
) => {
  const videosJSON = localStorage.getItem("videos");
  if (!videosJSON) return;

  const videos = JSON.parse(videosJSON);

  const updatedVideos = videos.map((video) => {
    if (video._id === videoId) {
      return {
        ...video,
        subtitle,
        subtitleId,
        customize,
      };
    }
    return video;
  });

  localStorage.setItem("videos", JSON.stringify(updatedVideos));
};

const update_cloud_urls_to_local_storage_by_video_id = (videoId, cloudUrl) => {
  const videosJSON = localStorage.getItem("videos");
  if (!videosJSON) return;

  const videos = JSON.parse(videosJSON);

  const updatedVideos = videos.map((video) => {
    if (video._id === videoId) {
      const existingCloudUrls = video.cloudUrls || [];

      return {
        ...video,
        cloudUrls: [...existingCloudUrls, cloudUrl],
      };
    }
    return video;
  });

  localStorage.setItem("videos", JSON.stringify(updatedVideos));
};



export {
  add_video_to_local_storage,
  update_video_in_local_storage,
  add_subtitle_to_local_storage_by_video_id,
  update_cloud_urls_to_local_storage_by_video_id,
};
