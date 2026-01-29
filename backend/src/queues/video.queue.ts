import { Queue } from "bullmq";
import redisConnection from "@configs/redis.config";

const videoQueue = new Queue("video-queue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 1800,
      count: 100,
    },
    removeOnFail: false,
  },
});

export default videoQueue;
