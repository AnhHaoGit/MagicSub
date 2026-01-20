"use client";
import SelectBox from "../SelectBox";
import { toast } from "react-toastify";

import { useState, useEffect } from "react";

const SubbedOption = ({ videoData, session }) => {
  const [sharingMode, setSharingMode] = useState(null);

  const handleSharingMode = async (value) => {
    console.log(value)
    setSharingMode(value);
    try {
      const res = await fetch("/api/change_upload_sharing_mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId: videoData._id, mode: value }),
      });

      const data = await res.json();

      if (data.ok) {
        toast.success(`Sharing mode updated successfully to ${value}.`);
      } else {
        toast.error("Failed to update sharing mode.");
      }
    } catch (error) {
      toast.error("Failed to update sharing mode.");
    }
  };

  useEffect(() => {
    setSharingMode(videoData?.mode);
  }, [videoData]);

  return (
    <div className="flex flex-col justify-center w-full mt-10">
      <SelectBox
        options={[
          { label: "Private", value: "private" },
          { label: "Restricted", value: "restricted" },
          { label: "Public", value: "public" },
        ]}
        label="Sharing Mode"
        value={sharingMode}
        onValueChange={handleSharingMode}
        placeholder="Select Sharing Mode"
      />
    </div>
  );
};

export default SubbedOption;
