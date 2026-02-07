import { Queue } from "bullmq";
import redisConnection from "@configs/redis.config";

const deleteionQueue = new Queue("delete-queue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1_000, // later --> 30s = 30_000
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export default deleteionQueue;