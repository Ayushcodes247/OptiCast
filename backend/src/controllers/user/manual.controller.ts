import { Request, Response, NextFunction } from "express";
import { UserModel, validateUserSchema } from "@models/user.model";
import { env } from "@configs/env.config";
import { AppError, asyncHandler } from "@utils/essentials.util";
import { AuthenticationRequest } from "../../types/auth.types";
import { BlackTokenModel, validateBlackToken } from "@models/balckToken.model";
import { generateCRSFtoken } from "@utils/essentials.util";

const TOKEN_NAME = "opticast_auth_token";
const CSRF_TOKEN_NAME = "opticast_csrf_token";

export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { username, email, password } = req.body;
    const provider = "local";

    if (!password) {
      return next(new AppError("Password is required", 400));
    }

    const data = { username, email, password, provider };
    const { value, error } = validateUserSchema(data);
    if (error) {
      return next(
        new AppError(error.details.map((d) => d.message).join(", "), 400),
      );
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return next(new AppError("User with this email already exists.", 409));
    }

    const hashPass = await UserModel.hashPassword(password);

    const user = await UserModel.create({
      ...value,
      password: hashPass,
    });

    const token = user.generateAuthToken();

    res.cookie(TOKEN_NAME, token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    });

    const csrf_token = generateCRSFtoken();

    res.cookie(CSRF_TOKEN_NAME, csrf_token, {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.username,
        email: user.email,
      },
      message: "User registration successful.",
    });
  },
);

export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;

    if (!email) {
      return next(new AppError("Email is required.", 400));
    }

    if (!password) {
      return next(new AppError("Password is required.", 400));
    }

    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      return next(
        new AppError("User for the provided email does not exist.", 404),
      );
    }

    if (user.provider !== "local") {
      return next(new AppError("Please login using Google.", 400));
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return next(new AppError("Invalid password.", 401));
    }

    const token = user.generateAuthToken();

    res.cookie(TOKEN_NAME, token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    });

    const csrf_token = generateCRSFtoken();

    res.cookie(CSRF_TOKEN_NAME, csrf_token, {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.username,
        email: user.email,
      },
      message: "Login successful.",
    });
  },
);

export const profile = asyncHandler(
  async (req: AuthenticationRequest, res: Response): Promise<void> => {
    const user = req.user;

    res.status(200).json({
      success: true,
      user,
      message: "Profile fetched successfully.",
    });
  },
);

export const logout = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token =
      req.cookies?.[TOKEN_NAME] ||
      (req.headers?.authorization?.startsWith("Bearer ")
        ? req.headers.authorization?.split(" ")[1]
        : null);

    const { value, error } = validateBlackToken({ token });
    if (error) {
      return next(
        new AppError(error.details.map((det) => det.message).join(", "), 400),
      );
    }

    await BlackTokenModel.create(value);

    res.clearCookie(TOKEN_NAME, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.clearCookie(CSRF_TOKEN_NAME, {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({
      success: true,
      message: "Logout successfully.",
    });
  },
);
