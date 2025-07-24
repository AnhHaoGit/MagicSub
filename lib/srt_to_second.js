export const srtToSecondsTimestamp = (srtTime) => {
  const [hours, minutes, rest] = srtTime.split(":");
  const [seconds, milliseconds] = rest.split(",");

  return (
    parseInt(hours) * 3600 +
    parseInt(minutes) * 60 +
    parseInt(seconds) +
    parseInt(milliseconds) / 1000
  );
};
