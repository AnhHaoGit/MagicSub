import format_duration from "@/lib/format_duration";
import Link from "next/link";

const HistoryBox = ({ video }) => {

  function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";

    const MB = 1024 * 1024;
    const GB = 1024 * MB;

    if (bytes >= GB) {
      return (bytes / GB).toFixed(2) + " GB";
    } else {
      return (bytes / MB).toFixed(2) + " MB";
    }
  }

  return (
    <div
      key={video._id}
      className="w-full p-4 border-light-gray flex items-center gap-4 rounded-3xl shadow-lg"
    >
      <div className="flex-shrink-0 w-2/10 items-center justify-center flex">
        <img src={video.thumbnailUrl} className="rounded-xl w-4/5"></img>
      </div>
      <div className="w-8/10 flex flex-col gap-2">
        <p className="font-bold text-sm">{video.title}</p>
        <div className="flex gap-2">
          <p className="text-xs px-2 rounded-lg bg-violet-200 font-semibold iris flex items-center justify-center h-">
            {video.subtitle ? <span>subtitle</span> : <span>uploaded</span>}
          </p>
          <p className="gray text-xs">
            {new Date(video.createdAt).toLocaleString()}
          </p>
        </div>

        <p className="text-xs gray">Duration: {format_duration(video.duration)}</p>
        <p className="text-xs gray">Size: {formatBytes(video.size)}</p>
        {video.cloudUrls && video.cloudUrls.length > 0 && (
          <p className="text-xs gray">
            Hard-subbed videos: {video.cloudUrls.length}
          </p>
        )}
      </div>

      <div className="w-2/10 flex items-center justify-center">
        {video.subtitle ? (
          <Link
            href={`/main/custom_subtitle/${video._id}`}
            className="white bg-iris font-bold p-2 rounded-full hover:bg-violet"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        ) : (
          <Link
            href={`/main/${video._id}`}
            className="white bg-iris font-bold p-2 rounded-full hover:bg-violet"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
};

export default HistoryBox;
