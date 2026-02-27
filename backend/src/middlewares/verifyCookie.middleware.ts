/**
 * ---------------------------------------------------------
 * PLAYBACK COOKIE VERIFICATION MIDDLEWARE
 * ---------------------------------------------------------
 *
 * Purpose:
 * - Validates signed playback JWT stored in cookies
 * - Ensures secure video playback access
 * - Attaches decoded payload to req.playback
 *
 * Used for:
 * - Public embed playback
 * - Preventing direct stream URL abuse
 *
 * Security Features:
 * - Signed cookies
 * - JWT verification
 * - Expiration handling
 * ---------------------------------------------------------
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "@utils/essentials.util";
import { env } from "@configs/env.config";

/**
 * Expected payload structure inside playback cookie
 */
interface VideoCookiePayload {
  mediaCollectionId: string; // Collection identifier
  videoId: string; // Video identifier
  exp: number; // Expiry timestamp (handled by JWT)
}

/**
 * Verify playback cookie
 */
const verifyCookie = (req: Request, res: Response, next: NextFunction) => {
  /**
   * Retrieve signed cookie
   * (Requires cookie-parser with secret configured)
   */
  const token = req.signedCookies?.[env.VIDEO_COOKIE];

  if (!token) {
    return next(new AppError("Playback token missing.", 401));
  }

  let payload: VideoCookiePayload;

  try {
    /**
     * Verify JWT signature and expiration
     */
    payload = jwt.verify(token, env.COOKIE_SECRET) as VideoCookiePayload;
  } catch {
    return next(new AppError("Invalid or expired playback token.", 401));
  }

  /**
   * Attach verified playback payload
   * Downstream controllers can trust this
   */
  req.playback = payload;

  next();
};

export default verifyCookie;
