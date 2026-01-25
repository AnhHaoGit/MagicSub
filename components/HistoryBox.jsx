import { useState } from "react";
import format_duration from "@/lib/format_duration";
import Link from "next/link";

const HistoryBox = ({ video, onDelete, isShared = false }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(video._id, video.userId);
    setShowConfirm(false);
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

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
    <>
      <Link
        href={isShared ? `/live/${video._id}` : `/main/${video._id}`}
        className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] md:w-[calc(33.33%-16px)] lg:w-[calc(25%-18px)] snap-center bg-white rounded-2xl shadow-md flex flex-col hover:shadow-lg transition-shadow relative"
      >
        <div className="flex items-center justify-center w-full aspect-video bg-black rounded-t-2xl overflow-hidden">
          <video src={video.cloudUrl} className="w-full h-full object-cover" />
        </div>

        <div className="p-3 flex flex-col gap-2">
          <p className="font-semibold text-sm line-clamp-2 h-10">
            {video.title}
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-tight">
            {isShared
              ? `Shared ${timeAgo(video.sharedAt)}`
              : `Uploaded ${timeAgo(video.createdAt)}`}
          </p>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs font-medium text-iris bg-iris/10 px-2 py-0.5 rounded">
              {format_duration(video.duration)}
            </span>
            <button
              onClick={handleDeleteClick}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
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
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </button>
          </div>
        </div>
      </Link>

      {showConfirm && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center">
            <h3 className="text-lg font-semibold mb-3">
              Are you sure you want to delete this video?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-between gap-3">
              <button
                onClick={handleCancel}
                className="w-1/2 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="w-1/2 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HistoryBox;
