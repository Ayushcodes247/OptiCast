import { Request, Response, NextFunction } from "express";
import { AppError, asyncHandler } from "@utils/essentials.util";
import redisConnection from "@configs/redis.config";
import { QueueEvents } from "bullmq";
import { Video, validateVideoSchema } from "@models/video.model";
import { randomUUID } from "crypto";
import queue from "../../jobs/video.job";
import { MediaCollectionModel } from "@models/mediacollection.model";
import { env } from "@configs/env.config";
import { generateSignedCookie } from "@utils/signedCookie.util";

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
      videoName: videoname,
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

export const requestVideo = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, videoId } = req.params;
    const collection = req.mediacollection;

    if (!collection || collection._id.toString() !== id) {
      return next(new AppError("Media collection not found.", 404));
    }

    const token = generateSignedCookie(id, String(videoId));

    res.cookie(env.VIDEO_COOKIE, token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
      signed: true,
    });

    res.status(303).redirect(`/api/video/${id}/stream/${videoId}`);
  },
);

export const stream = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, videoId } = req.params;
    const collection = req.mediacollection;
    const payload = req.playback;

    if (!collection || collection._id.toString() !== id) {
      return next(new AppError("Media collection not found.", 404));
    }

    if (!payload) {
      return next(new AppError("Playback token missing.", 401));
    }

    if (payload.mediaCollectionId !== id || payload.videoId !== videoId) {
      return next(new AppError("Playback token mismatch.", 403));
    }

    const video = await Video.findOne({
      videoId,
      mediaCollectionId: collection._id,
      status: "completed",
    });

    if (!video || !video.deliveryPath) {
      return next(new AppError("Video not ready for streaming.", 404));
    }

    res.redirect(302, video.deliveryPath);
  },
);

export const refresh = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {},
);
