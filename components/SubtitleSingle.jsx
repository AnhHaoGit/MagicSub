import { secondsToSrtTimestamp } from "@/lib/second_to_srt";

const SubtitleSingle = ({ start, end, text }) => {
  return (
    <>
      <div className="flex flex-col items-start justify-items-start w-full p-3 bg-white rounded-lg shadow-md mb-4 border-iris">
        <div className="flex items-center justify-items-start w-full">
          <div>
            <input type="text" />
          </div>
        </div>
        <div>
          <p>{text}</p>
        </div>
      </div>
    </>
  );
};

export default SubtitleSingle;
