import { v4 as uuidv4 } from "uuid";
import { srtToSecondsTimestamp } from "@/lib/srt_to_second";
import { secondsToSrtTimestamp } from "@/lib/second_to_srt";


export const formatSrtFile = (data, offset) => {
  const array = data.split("\n\n");
  const formattedData = [];

  for (let i = 0; i < array.length - 1; i++) {
    const items = array[i].split("\n");
    if (items.length < 3) continue;

    const startTime = srtToSecondsTimestamp(items[1].split(" --> ")[0]);
    const endTime = srtToSecondsTimestamp(items[1].split(" --> ")[1]);

    const updatedStart = startTime + offset;
    const updatedEnd = endTime + offset;

    formattedData.push({
      index: uuidv4(),
      start: secondsToSrtTimestamp(updatedStart),
      end: secondsToSrtTimestamp(updatedEnd),
      text: items.slice(2).join(" "),
    });
  }

  return formattedData;
};
