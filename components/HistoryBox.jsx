import format_duration from "@/lib/format_duration";
import Link from "next/link";

const HistoryBox = ({ video }) => {
  return (
    <div
      key={video._id}
      className="w-full p-4 border-light-gray flex items-center gap-4 rounded-3xl shadow-lg"
    >
      <div className="flex-shrink-0 w-1/10 items-center justify-center flex">
        <img src={video.thumbnailUrl} className="rounded-xl w-4/5"></img>
      </div>
      <div className="w-6/10 flex flex-col gap-1">
        <p className="font-bold text-lg">{video.title}</p>
        <p className="light-gray text-sm">
          {new Date(video.createdAt).toLocaleString()}
        </p>
        <p className="text-sm">{format_duration(video.duration)}</p>
      </div>
      <div className="w-2/10 h-full">
        {video.cloudUrls ? (
          <div className="h-full flex flex-col items-center">
            <p>{`Generated videos (${video.cloudUrls.length})`}</p>
            <div className="flex flex-col overflow-y-auto max-h-8/10 hide-scrollbar">
              {video.cloudUrls.map((url) => (
                <Link
                  key={url.id}
                  className="text-sm text-blue-500"
                  href={`/main/result/${video._id}/${url.id}`}
                >
                  {url.id}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <p>No generated videos</p>
          </div>
        )}
      </div>
      <div className="w-1/10 flex items-center justify-center">
        {video.subtitle ? (
          <Link
            href={`/main/custom_subtitle/${video._id}`}
            className="white bg-iris font-bold p-3 rounded-full hover:bg-violet"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
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
            className="white bg-iris font-bold p-3 rounded-full hover:bg-violet"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
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
