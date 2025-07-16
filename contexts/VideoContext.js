"use client";

import { createContext, useContext, useState } from "react";

const VideoContext = createContext();

export const useVideo = () => {
  return useContext(VideoContext);
};

export const VideoProvider = ({ children }) => {
  const [video, setVideo] = useState([]);

  const addVideo = (newVideo) => {
    setVideo((prevVideo) => {
      const updated = [...prevVideo, newVideo];
      localStorage.setItem("videos", JSON.stringify(updated));
      return updated;
    });
  };

const updateVideo = (_id, newDirectUrl) => {
  setVideo((prevVideo) => {
    const updated = prevVideo.map((video) =>
      video._id === _id ? { ...video, directUrl: newDirectUrl } : video
    );

    try {
      localStorage.setItem("videos", JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to update localStorage:", error);
    }

    return updated;
  });
};

  return (
    <VideoContext.Provider value={{ video, addVideo, updateVideo }}>
      {children}
    </VideoContext.Provider>
  );
};
