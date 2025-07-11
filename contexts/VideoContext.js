"use client";

import { createContext, useContext, useState } from "react";

const VideoContext = createContext();

export const useVideo = () => {
  return useContext(VideoContext);
};

export const VideoProvider = ({ children }) => {
  const [video, setVideo] = useState([]);

  const addVideo = (newVideo) => {
    setVideo((prevVideo) => [...prevVideo, newVideo]);
  };

  return (
    <VideoContext.Provider value={{ video, addVideo }}>
      {children}
    </VideoContext.Provider>
  );
};
