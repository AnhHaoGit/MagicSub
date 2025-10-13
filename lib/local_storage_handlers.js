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
  language
) => {
  const videosJSON = localStorage.getItem("videos");
  if (!videosJSON) return;

  const videos = JSON.parse(videosJSON);

  const updatedVideo = videos.find((video) => video._id === videoId);
  if (!updatedVideo.subtitles) {
    updatedVideo.subtitles = [{ subtitle, _id: subtitleId, language }];
  } else {
    updatedVideo.subtitles.push({ subtitle, _id: subtitleId, language });
  }
  localStorage.setItem("videos", JSON.stringify(videos));
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

function update_gems(cost) {
  const userStr = localStorage.getItem("user");
  if (!userStr) return;

  const user = JSON.parse(userStr);
  user.gems -= cost;

  localStorage.setItem("user", JSON.stringify(user));
}

const add_summary_to_local_storage_by_video_id = (
  videoId,
  summary,
  summaryId,
  summaryOption,
  language
) => {
  const videosJSON = localStorage.getItem("videos");
  if (!videosJSON) return;

  const videos = JSON.parse(videosJSON);

  const updatedVideo = videos.find((video) => video._id === videoId);
  if (!updatedVideo) return;

  if (!updatedVideo.summaries) {
    updatedVideo.summaries = [
      { summary, _id: summaryId, option: summaryOption, language: language },
    ];
  } else {
    updatedVideo.summaries.push({
      summary,
      _id: summaryId,
      option: summaryOption,
      language,
    });
  }

  localStorage.setItem("videos", JSON.stringify(videos));
};

export {
  add_video_to_local_storage,
  update_video_in_local_storage,
  add_subtitle_to_local_storage_by_video_id,
  update_cloud_urls_to_local_storage_by_video_id,
  update_gems,
  add_summary_to_local_storage_by_video_id,
};
