export const secondsToSrtTimestamp = (seconds) => {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  const ms = String(Math.floor((seconds % 1) * 1000)).padStart(3, "0");
  return `${h}:${m}:${s},${ms}`;
};
