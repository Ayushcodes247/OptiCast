import jwt from "jsonwebtoken";
import { env } from "@configs/env.config";

export const generateSignedCookie = (
  mediaCollectionId: string,
  videoId: string,
): string => {
  const secret = env.COOKIE_SECRET;
  const payload = {
    mediaCollectionId,
    videoId,
  };

  const token = jwt.sign(payload, secret, {
    expiresIn: "1h",
    algorithm: "HS256",
    issuer: "opticast",
    audience: "opticast_users",
  });

  return token;
};
