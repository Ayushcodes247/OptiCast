import { Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AuthenticationRequest } from "../types/auth.types";
import { BlackTokenModel } from "@models/balckToken.model";
import { env } from "@configs/env.config";
import { UserModel } from "@models/user.model";
import { AppError, asyncHandler } from "@utils/essentials.util";

interface AuthPayload extends JwtPayload {
  _id: string;
}

const TOKEN_NAME = "opticast_auth_token";

const isAuthenticated = asyncHandler(
  async (
    req: AuthenticationRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const token =
      req.cookies?.[TOKEN_NAME] ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers?.authorization?.split(" ")[1]
        : null);
    if (!token) {
      return next(new AppError("Authentication Token is missing.", 401));
    }

    let decoded: AuthPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ["HS256"],
      }) as AuthPayload;
    } catch {
      return next(
        new AppError("Invalid or expired authentication token.", 401),
      );
    }

    const isBlacklisted = await BlackTokenModel.exists({ token });
    if (isBlacklisted) {
      return next(
        new AppError("Token is blacklisted. Please login again.", 401),
      );
    }

    const user = await UserModel.findById(decoded._id)
      .select("-password -__v -createdAt -updatedAt -socketId")
      .lean();
    if (!user) {
      return next(new AppError("User not found.", 404));
    }

    req.user = user;

    next();
  },
);

export default isAuthenticated;
