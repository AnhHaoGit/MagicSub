"use client";

function calculateCost(fileSizeBytes, durationSeconds) {
  const minutes = durationSeconds / 60;
  const gigabytes = fileSizeBytes / 1024 ** 3;

  const costPerMinute = 0.006;
  const costPerGB = 0.023 + 0.09;

  const totalCost = costPerMinute * minutes + costPerGB * gigabytes;
  const totalGem = totalCost / 0.01;

  return Math.ceil(totalGem);
}
export default calculateCost;
