export const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const paddedHrs = hrs > 0 ? `${hrs < 10 ? "0" + hrs : hrs}:` : "";
  const paddedMins = mins < 10 ? `0${mins}` : mins;
  const paddedSecs = secs < 10 ? `0${secs}` : secs;

  return `${paddedHrs}${paddedMins}:${paddedSecs}`;
};
