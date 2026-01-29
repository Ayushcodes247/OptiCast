import videoQueue from "queues/video.queue";
import { AppError } from "@utils/essentials.util";

interface VideoJobPayload {
  videoId: string;
  inputPath: string;
}

export async function enqueueVideoJob({
  videoId,
  inputPath,
}: VideoJobPayload): Promise<string> {
  if (!videoId) {
    throw new AppError("VIDEO ID FOR TRANSCODING NOT PROVIDED.", 400);
  }

  if (!inputPath) {
    throw new AppError("VIDEO INPUT PATH IS NOT PROVIDED.", 400);
  }

  const job = await videoQueue.add("transcode-video", {
    videoId,
    inputPath,
  });

  return job.id!;
}
