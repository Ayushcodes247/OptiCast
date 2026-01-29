import { Queue } from "bullmq";
import redisConnection from "@configs/redis.config";

const videoQueue = new Queue("transcode-video", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 30_000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export default videoQueue;
