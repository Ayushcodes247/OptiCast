import deletionQueue from "queues/delete.queue";

/**
 * Adds a deletion job to queue
 */
const deletionJob = async (
  mediaCollectionId: string,
  videoIds: string[],
  deliveryPaths: string[],
) => {
  const deletionJob = await deletionQueue.add("delete-queue", {
    mediaCollectionId,
    videoIds,
    deliveryPaths,
  });

  return deletionJob.id;
};

export default deletionJob;
