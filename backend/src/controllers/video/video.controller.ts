import { Request, Response, NextFunction } from "express";
import { AppError, asyncHandler } from "@utils/essentials.util";
import redisConnection from "@configs/redis.config";
import { QueueEvents } from "bullmq";
import { Video, validateVideoSchema } from "@models/video.model";
import { randomUUID } from "crypto";
import queue from "../../jobs/video.job"

const event = new QueueEvents("transcode-queue", {
  connection: redisConnection,
});

event.on("progress", async ({ jobId }) => {
  await Video.updateOne({ jobId }, { status: "processing" });
});

event.on("completed", async ({ jobId, returnvalue }) => {
  if (
    typeof returnvalue === "object" &&
    returnvalue !== null &&
    "hlsPath" in returnvalue
  ) {
    await Video.updateOne(
      { jobId },
      {
        status: "completed",
        deliveryPath: (returnvalue as { hlsPath: string }).hlsPath,
      },
    );
  }
});

event.on("failed", async ({ jobId, failedReason }) => {
  await Video.updateOne({ jobId }, { status: "failed" });

  console.error("Transcoding failed:", failedReason);
});

export const uploadToBack = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file?.path) {
      return next(new AppError("File path not provided.", 400));
    }

    if (!req.user?._id) {
      return next(new AppError("Unauthorized", 401));
    }

    const videoId = randomUUID();
    const { videoname } = req.body;

    console.log("INPUT PATH:", req.file?.path)

    // MUST await
    const jobId = await queue(
      videoId,
      req.file?.path,
    );

    const videoDataObject = {
      videoId,
      userId: req.user._id.toString(),
      videoname,
      jobId,
      status: "queued",
    };

    const { value, error } = validateVideoSchema(videoDataObject);
    if (error) {
      return next(
        new AppError(error.details.map((d) => d.message).join(", "), 400),
      );
    }

    await Video.create({ ...value , deliveryPath : "" });

    res.status(201).json({
      success: true,
      message: "Video is queued for transcoding",
      videoId,
      jobId,
    });
  },
);
