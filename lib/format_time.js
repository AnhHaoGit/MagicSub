export const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 100); // lấy 2 chữ số sau dấu phẩy

  const paddedHrs = `${hrs < 10 ? "0" + hrs : hrs}:`;
  const paddedMins = mins < 10 ? `0${mins}` : mins;
  const paddedSecs = secs < 10 ? `0${secs}` : secs;
  const paddedMillis = millis < 10 ? `0${millis}` : millis;

  return `${paddedHrs}${paddedMins}:${paddedSecs}.${paddedMillis}`;
};
