import { Queue } from "bullmq";
import redisConnection from "@configs/redis.config";

const transcodeQueue = new Queue("transcode-queue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1_000, // later -> 30s
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export default transcodeQueue;
