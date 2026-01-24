import { RequestHandler } from "express";
import crypto from "crypto";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const generateCRSFtoken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};
