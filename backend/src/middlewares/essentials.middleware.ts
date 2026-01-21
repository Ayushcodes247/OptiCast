import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import { AppError } from "@utils/essentials.util";

export const checkDBConnection = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (mongoose.connection.readyState !== 1) {
    return next(
      new AppError(
        "OPTICAST DATABASE UNAVAILABLE. PLEASE TRY AGAIN LATER.",
        503,
        true,
      ),
    );
  }

  next();
};

export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const isOperational = error instanceof AppError;

  const statusCode = isOperational ? error.statusCode : 500;
  const message = isOperational ? error.message : "Internal server error.";

  if (!isOperational) {
    console.error(`[${req.method}] ${req.originalUrl}`);
    console.error("Error stack:", error.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};
