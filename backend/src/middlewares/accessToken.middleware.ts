/**
 * ---------------------------------------------------------
 * MEDIA COLLECTION ACCESS TOKEN MIDDLEWARE
 * ---------------------------------------------------------
 * Verifies:
 * - Bearer access token
 * - Token matches hashed token in DB
 * ---------------------------------------------------------
 */

import { Request, Response, NextFunction } from "express";
import { AppError } from "@utils/essentials.util";
import { MediaCollectionModel } from "@models/mediacollection.model";

const isVerifiedMediaCollection = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Access token is missing.", 401));
  }

  const token = authHeader.replace("Bearer ", "").trim();

  const collection = await MediaCollectionModel.findById(id).select(
    "-__v -createdAt -updatedAt",
  );

  if (!collection) {
    return next(new AppError("Media collection not found.", 404));
  }

  const isValid = await collection.compareAccessToken(token);
  if (!isValid) {
    return next(new AppError("Invalid access token.", 403));
  }

  req.mediacollection = collection;
  next();
};

export default isVerifiedMediaCollection;
