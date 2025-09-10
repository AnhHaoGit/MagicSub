import format_duration from "@/lib/format_duration";
import Link from "next/link";
import { languages } from "@/lib/languages";

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
  console.log("Rendering HistoryBox for video:", video);

  const formatLanguage = (code) => {
    const lang = languages.find((l) => l.code === code);
    return lang ? lang.name : code;
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
            {video.subtitles ? <span>subtitle</span> : <span>uploaded</span>}
          </p>
          <p className="gray text-xs">
            {new Date(video.createdAt).toLocaleString()}
          </p>
        </div>

        <p className="text-xs gray">
          Duration: {format_duration(video.duration)}
        </p>
        <div className="flex gap-2 text-xs gray">
          Languages:
          {video.subtitles &&
            video.subtitles.length > 0 &&
            video.subtitles.map((sub) => (
              <Link
                key={sub._id}
                href={`/main/custom_subtitle/${video._id}?subtitleId=${sub._id}`}
                className="underline iris text-xs"
              >
                {formatLanguage(sub.language)}
              </Link>
            ))}
        </div>
        <p className="text-xs gray">Size: {formatBytes(video.size)}</p>
        {video.cloudUrls && video.cloudUrls.length > 0 && (
          <p className="text-xs gray">
            Hard-subbed videos: {video.cloudUrls.length}
          </p>
        )}
      </div>
      <div className="w-2/10 flex items-center justify-center">
        <Link
          href={`/main/${video._id}`}
          className="white bg-iris text-xs px-3 py-2 rounded-full hover:bg-violet transition-colors"
        >New subtitle</Link>
      </div>
    </div>
  );
};

export default HistoryBox;
