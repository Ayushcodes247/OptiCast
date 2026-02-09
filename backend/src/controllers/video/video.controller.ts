import { Request, Response, NextFunction } from "express";
import { AppError, asyncHandler } from "@utils/essentials.util";
import redisConnection from "@configs/redis.config";
import { QueueEvents } from "bullmq";
import { Video, validateVideoSchema } from "@models/video.model";
import { randomUUID } from "crypto";
import queue from "../../jobs/video.job";
import { MediaCollectionModel } from "@models/mediacollection.model";

const event = new QueueEvents("transcode-queue", {
  connection: redisConnection,
});

event.on("progress", async ({ jobId }) => {
  await Video.updateOne({ jobId }, { status: "processing" });
});

event.on("completed", async ({ jobId, returnvalue }) => {
  if (
    typeof returnvalue !== "object" ||
    returnvalue === null ||
    !("hlsPath" in returnvalue)
  ) {
    return;
  }

  const hlsPath = (returnvalue as { hlsPath: string }).hlsPath;

  const video = await Video.findOneAndUpdate(
    { jobId },
    {
      status: "completed",
      deliveryPath: hlsPath,
    },
    { new: true },
  );

  if (!video) return;

  await MediaCollectionModel.updateOne(
    { _id: video.mediaCollectionId },
    {
      $push: { deliveryPaths: hlsPath },
    },
  );
});

event.on("failed", async ({ jobId, failedReason }) => {
  await Video.updateOne({ jobId }, { status: "failed" });
  console.error("Transcoding failed:", failedReason);
});

export const uploadToBack = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const collection = req.mediacollection;

    if (!id) {
      return next(
        new AppError("Media Collection ID not provided in params", 400),
      );
    }

    if (!req.file?.path) {
      return next(new AppError("File path not provided.", 400));
    }

    if (!req.user?._id) {
      return next(new AppError("Unauthorized", 401));
    }

    if (collection?.userId.toString() !== req.user._id.toString()) {
      return next(new AppError("Forbidden", 403));
    }

    const videoId = randomUUID();
    const { videoname } = req.body;

    const jobId = await queue(videoId, req.file.path);

    const videoDataObject = {
      videoId,
      userId: req.user._id.toString(),
      videoname,
      jobId,
      status: "queued",
      mediaCollectionId: collection?._id.toString(),
    };

    const { value, error } = validateVideoSchema(videoDataObject);
    if (error) {
      return next(
        new AppError(error.details.map((d) => d.message).join(", "), 400),
      );
    }

    const video = await Video.create({
      ...value,
      deliveryPath: "",
    });

    collection.videosId.push(video._id);
    await collection.save();

    res.status(201).json({
      success: true,
      message: "Video is queued for transcoding",
      videoId,
      jobId,
    });
  },
);

export const playback = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {} = req.body;
  },
);

export const refresh = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {},
);
