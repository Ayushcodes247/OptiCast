import transcodeQueue from "queues/video.queue";

const videoJob = async (videoId: string, inputPath: string) => {
  const job = await transcodeQueue.add("transcode-queue", {
    videoId,
    inputPath,
  });

  return job.id;
};

export default videoJob;