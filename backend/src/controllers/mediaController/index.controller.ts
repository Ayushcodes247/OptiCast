/**
 * ---------------------------------------------------------
 * MEDIA COLLECTION CONTROLLER
 * ---------------------------------------------------------
 * Business logic for:
 * - Collection lifecycle
 * - Origin validation
 * - Playback UI settings
 * - Secure access token handling
 * ---------------------------------------------------------
 */

import { Request, Response, NextFunction } from "express";
import {
  MediaCollectionModel,
  validateMediaCollectionSchema,
} from "@models/mediacollection.model";
import { asyncHandler, AppError } from "@utils/essentials.util";
import { generateAccessToken } from "@utils/accessTokenGenerate.util";
import deletionJob from "jobs/delete.job";
import { validateSettings, Settings } from "@models/settings.model";

/**
 * Create media collection
 */
export const create = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { mediaCollectionName, allowedOrigins } = req.body;

    if (!req.user?._id) {
      return next(new AppError("Unauthorized", 401));
    }

    const data = {
      userId: req.user._id.toString(),
      mediaCollectionName,
      allowedOrigins: [allowedOrigins],
    };

    const { value, error } = validateMediaCollectionSchema(data);
    if (error) {
      return next(
        new AppError(error.details.map((d) => d.message).join(", "), 400),
      );
    }

    const accessToken = generateAccessToken();
    const hashedAccessToken =
      await MediaCollectionModel.hashAccessToken(accessToken);

    const mediaCollection = await MediaCollectionModel.create({
      ...value,
      accessTokenHash: hashedAccessToken,
    });

    res.status(201).json({
      success: true,
      mediaCollection: {
        name: mediaCollection.mediaCollectionName,
        mediaCollectionId: mediaCollection._id,
        allowedOrigins: mediaCollection.allowedOrigins,
      },
      accessToken,
      message: "Media collection created successfully.",
    });
  },
);

/**
 * Regenerate access token for a collection
 */
export const regenerateAccessToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    if (!req.user?._id) {
      return next(new AppError("Unauthorized", 401));
    }

    const findCollection = await MediaCollectionModel.findById(id);
    if (!findCollection) {
      return next(new AppError("Not found.", 404));
    }

    if (findCollection.userId.toString() !== req.user._id.toString()) {
      return next(new AppError("Forbidden", 403));
    }

    const newAccessToken = generateAccessToken();
    const hashNewAccessToken =
      await MediaCollectionModel.hashAccessToken(newAccessToken);

    findCollection.accessTokenHash = hashNewAccessToken;
    await findCollection.save();

    res.status(200).json({
      success: true,
      regeneratedToken: newAccessToken,
      message: "New Access Token generated successfully.",
    });
  },
);

/**
 * Add allowed origins
 */
export const addOrigins = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let { allowedOrigins } = req.body;

    if (!req.user?._id) {
      return next(new AppError("Unauthorized", 401));
    }

    const collection = req.mediacollection;

    if (collection?.userId.toString() !== req.user._id.toString()) {
      return next(new AppError("Forbidden", 403));
    }

    if (!Array.isArray(allowedOrigins)) {
      allowedOrigins = [allowedOrigins];
    }

    const uniqueOrigins = allowedOrigins.filter(
      (origin: string) => !collection.allowedOrigins.includes(origin),
    );

    collection.allowedOrigins.push(...uniqueOrigins);
    await collection.save();

    res.status(200).json({
      success: true,
      addedOrigins: uniqueOrigins,
    });
  },
);

/**
 * Remove a specific allowed origin
 */
export const removeOrigin = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let { removeorigin } = req.body;

    if (!req.user?._id) {
      return next(new AppError("Unauthorized", 401));
    }

    const collection = req.mediacollection;

    if (collection?.userId.toString() !== req.user._id.toString()) {
      return next(new AppError("Forbidden", 403));
    }

    const normalizedRemoveOrigin = String(removeorigin)
      .toLowerCase()
      .replace(/\/$/, "");

    collection.allowedOrigins = collection.allowedOrigins.filter(
      (origin) => origin !== normalizedRemoveOrigin,
    );

    await collection.save();

    res.status(200).json({
      success: true,
      message: "Origin removed successfully.",
    });
  },
);

/**
 * Delete media collection
 * - Triggers async deletion job
 */
export const removeMediaCollection = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const collection = req.mediacollection;
    const uid = req.user?._id;

    if (!uid) {
      return next(new AppError("Unauthorized", 401));
    }

    if (collection?.userId.toString() !== uid.toString()) {
      return next(new AppError("Forbidden", 403));
    }

    const deletion = await deletionJob(
      collection._id.toString(),
      Array(collection.videosId.toString()),
      collection.deliveryPath,
    );

    await collection.deleteOne();

    res.status(200).json({
      success: true,
      deletionId: deletion,
      message: "Media collection deletion initiated",
    });
  },
);

/**
 * Save / update playback UI settings
 */
export const setting = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { iconColor } = req.body;
    let { playbackSpeed } = req.body;

    const collection = req.mediacollection;
    const userId = req.user?._id;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    if (collection?.userId.toString() !== userId.toString()) {
      return next(new AppError("Forbidden", 403));
    }

    if (playbackSpeed && !Array.isArray(playbackSpeed)) {
      playbackSpeed = [playbackSpeed];
    }

    const existingSettings = await Settings.findOne({
      userId,
      mediaCollectionId: collection._id,
    });

    const data = {
      userId: userId.toString(),
      mediaCollectionId: collection?._id.toString(),
      playbackSpeed: playbackSpeed ?? existingSettings?.playbackSpeed ?? [1],
      iconColor: iconColor ?? existingSettings?.iconColor ?? "#00C950",
    };

    const { value, error } = validateSettings(data);
    if (error) {
      return next(
        new AppError(error.details.map((d) => d.message).join(", "), 400),
      );
    }

    const settings = await Settings.findOneAndUpdate(
      { userId, mediaCollectionId: collection._id },
      value,
      { upsert: true, new: true },
    );

    res.status(200).json({
      success: true,
      settings: {
        playbackSpeed: settings.playbackSpeed,
        iconColor: settings.iconColor,
      },
      message: "Settings saved successfully.",
    });
  },
);

/**
 * Fetch playback settings for public embed
 */
export const getSettings = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const playback = req.playback;
    const collection = req.mediacollection;

    if (!collection) {
      return next(new AppError("Media collection not found.", 404));
    }

    if (!playback || playback.mediaCollectionId !== collection._id.toString()) {
      return next(new AppError("Media collection mismatch.", 403));
    }

    const settings = await Settings.findOne({
      mediaCollectionId: collection._id,
    }).lean();

    res.status(200).json({
      success: true,
      settings: {
        playbackSpeed: settings?.playbackSpeed ?? [1],
        iconColor: settings?.iconColor ?? "#000000",
      },
      message: "Settings retrieved successfully.",
    });
  },
);
