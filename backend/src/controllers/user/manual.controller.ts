/**
 * ---------------------------------------------------------
 * MANUAL AUTH CONTROLLER
 * ---------------------------------------------------------
 * Handles:
 * - User registration (local provider)
 * - User login
 * - Profile retrieval
 * - Logout with token blacklisting
 * ---------------------------------------------------------
 */

import { Request, Response, NextFunction } from "express";
import { UserModel, validateUserSchema } from "@models/user.model";
import { env } from "@configs/env.config";
import { AppError, asyncHandler } from "@utils/essentials.util";
import { BlackTokenModel, validateBlackToken } from "@models/balckToken.model";
import { generateCRSFtoken } from "@utils/essentials.util";

/**
 * Cookie Names
 */
const TOKEN_NAME = "opticast_auth_token";
const CSRF_TOKEN_NAME = "opticast_csrf_token";

/**
 * ---------------------------------------------------------
 * REGISTER USER (LOCAL AUTH)
 * ---------------------------------------------------------
 */
export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { username, email, password } = req.body;
    const provider = "local";

    /**
     * Basic validation
     */
    if (!password) {
      return next(new AppError("Password is required", 400));
    }

    /**
     * Schema validation (Joi)
     */
    const data = { username, email, password, provider };
    const { value, error } = validateUserSchema(data);
    if (error) {
      return next(
        new AppError(error.details.map((d) => d.message).join(", "), 400),
      );
    }

    /**
     * Check if user already exists
     */
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return next(new AppError("User with this email already exists.", 409));
    }

    /**
     * Hash password before storing
     */
    const hashPass = await UserModel.hashPassword(password);

    /**
     * Create user
     */
    const user = await UserModel.create({
      ...value,
      password: hashPass,
    });

    /**
     * Generate JWT Auth Token
     */
    const token = user.generateAuthToken();

    /**
     * Set Auth Cookie (HTTP-only)
     */
    res.cookie(TOKEN_NAME, token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      priority: "high",
    });

    /**
     * Generate & set CSRF token (Readable by frontend)
     */
    const csrf_token = generateCRSFtoken();

    res.cookie(CSRF_TOKEN_NAME, csrf_token, {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    /**
     * Response
     */
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

/**
 * ---------------------------------------------------------
 * LOGIN USER (LOCAL AUTH)
 * ---------------------------------------------------------
 */
export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;

    /**
     * Input validation
     */
    if (!email) {
      return next(new AppError("Email is required.", 400));
    }

    if (!password) {
      return next(new AppError("Password is required.", 400));
    }

    /**
     * Fetch user with password
     */
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      return next(
        new AppError("User for the provided email does not exist.", 404),
      );
    }

    /**
     * Ensure local login only
     */
    if (user.provider !== "local") {
      return next(new AppError("Please login using Google.", 400));
    }

    /**
     * Password verification
     */
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return next(new AppError("Invalid password.", 401));
    }

    /**
     * Generate JWT
     */
    const token = user.generateAuthToken();

    /**
     * Set Auth Cookie
     */
    res.cookie(TOKEN_NAME, token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      priority: "high",
    });

    /**
     * Generate & set CSRF token
     */
    const csrf_token = generateCRSFtoken();

    res.cookie(CSRF_TOKEN_NAME, csrf_token, {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    /**
     * Response
     */
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

/**
 * ---------------------------------------------------------
 * FETCH USER PROFILE
 * ---------------------------------------------------------
 */
export const profile = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user;

    res.status(200).json({
      success: true,
      user,
      message: "Profile fetched successfully.",
    });
  },
);

/**
 * ---------------------------------------------------------
 * LOGOUT USER
 * ---------------------------------------------------------
 * - Blacklists token
 * - Clears auth & CSRF cookies
 * ---------------------------------------------------------
 */
export const logout = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    /**
     * Extract token from cookie or header
     */
    const token =
      req.cookies?.[TOKEN_NAME] ||
      (req.headers?.authorization?.startsWith("Bearer ")
        ? req.headers.authorization?.split(" ")[1]
        : null);

    /**
     * Validate token before blacklisting
     */
    const { value, error } = validateBlackToken({ token });
    if (error) {
      return next(
        new AppError(error.details.map((det) => det.message).join(", "), 400),
      );
    }

    /**
     * Store token in blacklist
     */
    await BlackTokenModel.create(value);

    /**
     * Clear auth cookies
     */
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
