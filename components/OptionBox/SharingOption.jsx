"use client";
import SelectBox from "../SelectBox";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";

import default_avatar from "@/assets/default_avatar.png";
import Image from "next/image";

const SharingOption = ({ videoData }) => {
  const [sharingMode, setSharingMode] = useState(videoData.mode);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allowedUsers, setAllowedUsers] = useState(
    videoData.allowedUsers || [],
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        const res = await fetch(`/api/search?q=${searchTerm}`);
        const data = await res.json();
        console.log(data);
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const addUser = async (user) => {
    if (allowedUsers.find((u) => u._id === user._id)) {
      toast.info("User already added");
      return;
    }

    try {
      const res = await fetch("/api/allow_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: videoData._id,
          user: user,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setAllowedUsers([...allowedUsers, user]);
        setSearchTerm("");
        setSearchResults([]);
        toast.success(`Added ${user.email} to access list`);
      } else {
        toast.error(data.error || "Failed to add user");
      }
    } catch (error) {
      toast.error("Try again later!");
    }
  };

  const handleRemoveUser = async (userId) => {
    try {
      const res = await fetch("/api/remove_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: videoData._id,
          userId: userId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setAllowedUsers((prev) => prev.filter((u) => u._id !== userId));
        toast.success("User removed from access list");
      } else {
        toast.error(data.error || "Failed to remove user");
      }
    } catch (error) {
      console.error(error);
      toast.error("Try again later!");
    }
  };

  const handleSharingMode = async (value) => {
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="flex flex-col justify-between items-center h-9/10 w-full mt-5">
      <div className="flex flex-col justify-center items-center gap-10 w-full">
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

        {sharingMode === "restricted" && (
          <div className="w-full max-w-md relative">
            <label className="text-[10px]">Add allowed users by email</label>
            <input
              type="text"
              placeholder="Type an email..."
              className="w-full p-2 border text-md border-gray-300 rounded-lg focus:ring-1 outline-none mt-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {searchResults.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg overflow-hidden">
                {searchResults.map((user) => (
                  <li
                    key={user._id}
                    onClick={() => addUser(user)}
                    className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-8 h-8 rounded-full border"
                      />
                    ) : (
                      <Image
                        src={default_avatar}
                        alt={user.email}
                        className="w-8 h-8 rounded-full border"
                      />
                    )}

                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-gray-500">
                        {user.email}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 w-full">
              <div className="max-h-44 overflow-y-auto pr-2 hide-scrollbar flex flex-wrap gap-3">
                {allowedUsers.length > 0 ? (
                  allowedUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-3 bg-white p-2 pr-4 rounded-xl border border-gray-200 shadow-sm transition-all group"
                    >
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-100 flex-shrink-0">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <Image
                            src={default_avatar}
                            alt={user.email}
                            className="object-cover w-full h-full"
                          />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-semibold text-gray-800 truncate leading-tight">
                          {user.name}
                        </span>
                        <span className="text-[11px] text-gray-500 truncate leading-tight">
                          {user.email}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRemoveUser(user._id)}
                        className="ml-1 text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Remove access"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                          className="size-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    No users added yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleCopyLink}
        className="flex items-center gap-2 bg-iris text-white rounded-full py-2 px-8 md:py-3 md:px-15 shadow-xl font-semibold justify-center hover:bg-violet transition-colors cursor-pointer text-xs md:text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
          />
        </svg>
        Copy link
      </button>
    </div>
  );
};

export default SharingOption;
