import Link from "next/link";
import format_duration from "@/lib/format_duration";

const HardSubbedBox = ({ data }) => {
  return (
    <div
      key={data._id}
      className="w-full p-4 border-light-gray flex items-center gap-4 rounded-3xl shadow-lg"
    >
      <div className="flex-shrink-0 w-2/10 items-center justify-center flex">
        <img src={data.thumbnailUrl} className="rounded-xl w-4/5"></img>
      </div>
      <div className="w-8/10 flex flex-col gap-1">
        <p className="font-bold text-sm">{data.title}</p>
        <div className="flex gap-2">
          <p className="text-xs px-2 rounded-lg bg-violet-200 font-semibold iris flex items-center justify-center h-">
            hard-subbed
          </p>
          <p className="light-gray text-sm">
            {new Date(data.createdAt).toLocaleString()}
          </p>
        </div>

        <p className="text-xs">{format_duration(data.duration)}</p>
      </div>

      <div className="w-2/10 flex items-center justify-center">
        <Link
          href={`/main/result/${data.videoId}/${data.id}`}
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
      </div>
    </div>
  );
};

export default HardSubbedBox;
