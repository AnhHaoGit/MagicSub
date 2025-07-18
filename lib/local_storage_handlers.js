const add_video_to_local_storage = (video) => {
  const videos = JSON.parse(localStorage.getItem("videos"));
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

export { add_video_to_local_storage, update_video_in_local_storage };
