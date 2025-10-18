"use client";

import Link from "next/link";

const SubbedOption = ({ videoData, session }) => {
  const cloudUrls = videoData?.cloudUrls || [];

  console.log(cloudUrls);

  function timeAgo(dateString) {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now - created;

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    function pluralize(value, unit) {
      return `${value} ${unit}${value !== 1 ? "s" : ""} ago`;
    }

    if (seconds < 60) return pluralize(seconds, "second");
    if (minutes < 60) return pluralize(minutes, "minute");
    if (hours < 24) return pluralize(hours, "hour");
    if (days < 7) return pluralize(days, "day");
    if (days < 30) return pluralize(Math.floor(days / 7), "week");
    if (days < 365) return pluralize(Math.floor(days / 30), "month");
    return pluralize(Math.floor(days / 365), "year");
  }

  return (
    <div className="w-full h-full flex flex-col items-center max-h-[60vh] border border-gray-300 rounded-xl p-4 bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Hard-Subbed Videos</h2>
      <div className="w-full overflow-y-auto space-y-2 flex flex-col max-h-[80px]">
        {cloudUrls && cloudUrls.length > 0 ? (
          cloudUrls.map((url, index) => (
            <Link
              href={`/main/result/${videoData._id}/${url.id}`}
              key={index}
              className="text-sm w-full flex flex-col bg-gray-100 rounded-lg px-3 py-2 hover:bg-gray-200 transition-colors"
            >
              <span className="text-xs">{url.id}</span>{" "}
              <span className="text-xs text-gray-500">
                {" "}
                Uploaded {timeAgo(url.createdAt)}
              </span>{" "}
            </Link>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center">
            No hard-subbed videos generated yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default SubbedOption;
