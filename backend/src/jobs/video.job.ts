import videoQueue from "queues/video.queue";
import { asyncHandler, AppError } from "@utils/essentials.util";

const videoJob = asyncHandler(async (videoId, inputPath) => {
  if (!videoId) {
    return new AppError("VIDEO ID FOR TRANSCODING NOT PROVIDED.", 400);
  }

  if (!inputPath) {
    return new AppError("VIDEO INPUT PATH IS NOT PROVIDED.", 400);
  }

  const job = await videoQueue.add("video-queue", {
    videoId,
    inputPath,
  });

  return job.id;
});

export default videoJob;
