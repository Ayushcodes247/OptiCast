import { OAuth2Client } from "google-auth-library";
import { UserModel } from "@models/user.model";
import { env } from "@configs/env.config";
import { AppError, asyncHandler } from "@utils/essentials.util";
import { Request, Response, NextFunction } from "express";
import { generateCRSFtoken } from "@utils/essentials.util";

const googleClient = new OAuth2Client(env.CLIENT_ID);
const AUTH_TOKEN = "opticast_auth_token";
const CSRF_TOKEN_NAME = "opticast_csrf_token";
const csrf_token = generateCRSFtoken();

export const googleAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authorization = req.headers?.authorization?.split(" ")[1];
    if (!authorization) {
      return next(new AppError("Missing token", 401));
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: authorization,
      audience: env.CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return next(new AppError("Invalid Google token", 401));
    }

    const { sub, email, name } = payload;

    if (!sub || !email || !name) {
      return next(new AppError("Google account data incomplete", 400));
    }

    let user = await UserModel.findOne({ googleId: sub }).select("+password");

    if (!user) {
      user = await UserModel.create({
        username: name,
        email,
        provider: "google",
        googleId: sub,
      });
    }

    const token = user.generateAuthToken();

    res.cookie(AUTH_TOKEN, token, {
      maxAge: 1 * 24 * 60 * 60 * 1000,
      secure: env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.cookie(CSRF_TOKEN_NAME, csrf_token, {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        googleId: user.googleId,
      },
      message: "Login Successfully.",
    });
  },
);
