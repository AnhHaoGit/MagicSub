"use client";

import { useRef, useEffect } from "react";

const SubtitleScrollBox = ({ subtitle, setSubtitle, activeSubtitleIndex }) => {
  const itemRefs = useRef([]);

  const updateSubtitle = (indexToUpdate, newData) => {
    setSubtitle((prev) =>
      prev.map((item, index) =>
        index === indexToUpdate ? { ...item, ...newData } : item
      )
    );
  };

  const addSubtitle = (indexToAddAfter) => {
    const newSubtitle = {
      start: "00:00:00,000",
      end: "00:00:00,000",
      text: "",
    };
    setSubtitle((prev) => {
      const updated = [...prev];
      updated.splice(indexToAddAfter + 1, 0, newSubtitle);
      return updated;
    });
  };

  const deleteSubtitle = (indexToDelete) => {
    setSubtitle((prev) => prev.filter((_, index) => index !== indexToDelete));
  };

  useEffect(() => {
    const domIndex = subtitle.findIndex(
      (item) => item.index === activeSubtitleIndex
    );

    if (domIndex !== -1 && itemRefs.current[domIndex]) {
      itemRefs.current[domIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeSubtitleIndex, subtitle]);

  return (
    <div className="flex flex-col gap-3 bg-light-gray shadow-lg max-h-full overflow-y-auto p-3 rounded-2xl mt-15">
      {subtitle.map((item, index) => (
        <div key={index} ref={(el) => (itemRefs.current[index] = el)}>
          <div
            className={`flex bg-white gray flex-col items-start justify-items-start w-full p-3 gap-2 rounded-lg shadow-md transition-colors ${
              item.index === activeSubtitleIndex ? "border-iris" : ""
            }`}
          >
            <div className="flex items-center justify-between w-full border-b-1 pb-1 border-b-light-gray">
              <div className="flex items-center justify-between gap-3 gray text-xs">
                <p>{index + 1}</p>
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={item.start}
                    onChange={(e) =>
                      updateSubtitle(index, { start: e.target.value })
                    }
                    className="rounded-sm text-center w-22 bg-gray white"
                  />
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
                      d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
                    />
                  </svg>
                  <input
                    type="text"
                    value={item.end}
                    onChange={(e) =>
                      updateSubtitle(index, { end: e.target.value })
                    }
                    className="rounded-sm text-center w-22 bg-gray white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <button
                  className="hover:iris"
                  onClick={() => addSubtitle(index)}
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
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </button>
                <button
                  className="hover:iris"
                  onClick={() => deleteSubtitle(index)}
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
            <div>
              <textarea
                value={item.text}
                onChange={(e) =>
                  updateSubtitle(index, { text: e.target.value })
                }
                cols={60}
                rows={3}
                className="w-full text-sm hide-scrollbar resize-none p-1"
              ></textarea>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubtitleScrollBox;
