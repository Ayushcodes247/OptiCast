import { Request, Response, NextFunction } from "express";
import { AppError } from "@utils/essentials.util";
import { MediaCollectionModel } from "@models/mediacollection.model";

const isVerifiedMediaCollection = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { mediaCollectionId } = req.params;

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Access token is missing.", 401));
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const collection = await MediaCollectionModel.findOne({
    _id: mediaCollectionId,
  });
  if (!collection) {
    return next(new AppError("Media collection not found.", 404));
  }

  const isTrue = await collection.compareAccessToken(token);
  if (!isTrue) {
    return next(new AppError("Invalid access token.", 403));
  }

  req.mediacollection = collection;

  next();
};

export default isVerifiedMediaCollection;
