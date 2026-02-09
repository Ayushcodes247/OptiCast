import { Worker } from "bullmq";
import { Video } from "../models/video.model";
import fs from "fs/promises";
import path from "path";
import redisConnection from "../configs/redis.config";

new Worker(
  "delete-queue",
  async (job) => {
    console.info("Processing Delete JOB:",job.id);

    const { mediaCollectionId, videoIds, deliveryPaths } = job.data;

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return;
    }

    await Video.deleteMany({
      _id: { $in: videoIds },
    });

    if (Array.isArray(deliveryPaths)) {
      for (const filePath of deliveryPaths) {
        try {
          await fs.rm(path.resolve(filePath), {
            recursive: true,
            force: true,
          });
        } catch (err) {
          console.error("Failed to delete file:", filePath);
          throw err;
        }
      }
    }

    console.info(
      `Deleted mediaCollection=${mediaCollectionId}, videos=${videoIds.length}`,
    );
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
);
