import transcodeQueue from "queues/video.queue";

const videoJob = async (mediaCollectionId : string, videoId: string, inputPath: string) => {
  const job = await transcodeQueue.add("transcode-queue", {
    mediaCollectionId,
    videoId,
    inputPath,
  });

  return job.id;
};

export default videoJob;
