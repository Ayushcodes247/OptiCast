import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "@utils/essentials.util";
import { env } from "@configs/env.config";

interface VideoCookiePayload {
  mediaCollectionId: string;
  videoId: string;
  exp: number;
}

const verifyCookie = (req: Request, res: Response, next: NextFunction) => {
  const token = req.signedCookies?.[env.VIDEO_COOKIE];
  if (!token) {
    return next(new AppError("Playback token missing.", 401));
  }

  let payload: VideoCookiePayload;

  try {
    payload = jwt.verify(token, env.COOKIE_SECRET) as VideoCookiePayload;
  } catch {
    return next(new AppError("Invalid or expired playback token.", 401));
  }

  req.playback = payload;

  next();
};

export default verifyCookie;
