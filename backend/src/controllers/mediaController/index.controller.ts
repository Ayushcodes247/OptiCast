import { Request, Response, NextFunction } from "express";
import {
  MediaCollectionModel,
  validateMediaCollectionSchema,
} from "@models/mediacollection.model";
import { asyncHandler, AppError } from "@utils/essentials.util";
import { generateAccessToken } from "@utils/accessTokenGenerate.util";

export const create = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { mediaCollectionName, allowedOrigins } = req.body;

    if (!req.user?._id) {
      return next(new AppError("Unauthorized", 401));
    }

    const data = {
      userId: req.user?._id.toString(),
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

export const regenerateAccessToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { mediaCollectionId } = req.params;

    if (!req.user?._id) {
      return next(new AppError("Unauthorized", 401));
    }

    const findCollection =
      await MediaCollectionModel.findById(mediaCollectionId);
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

export const addOrigins = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { mediaCollectionId } = req.params;
    let { allowedOrigins } = req.body;

    if (!mediaCollectionId) {
      return next(new AppError("Media collection id not provided.", 400));
    }

    if (!req.user?._id) {
      return next(new AppError("Unauthorized", 401));
    }

    if (req.mediacollection?.userId.toString() !== req.user._id.toString()) {
      return next(new AppError("Forbidden", 403));
    }

    const collection = req.mediacollection;

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

export const removeOrigin = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { mediaCollectionId } = req.params;
    let { removeorigin } = req.body;

    if (!mediaCollectionId) {
      return next(new AppError("Media collection id not provided.", 400));
    }

    if (!req.user?._id) {
      return next(new AppError("Unauthorized", 401));
    }

    if (req.mediacollection?.userId.toString() !== req.user._id.toString()) {
      return next(new AppError("Forbidden", 403));
    }

    const collection = req.mediacollection;

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
