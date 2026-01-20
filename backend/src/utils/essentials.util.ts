import { RequestHandler } from "express";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = false) {
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
