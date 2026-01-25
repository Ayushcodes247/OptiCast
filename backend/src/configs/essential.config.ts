import { rateLimit } from "express-rate-limit";
import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const time = (): string => new Date().toISOString();

export const routerRateLImiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: {
    error: "TOO MANY REQUEST FROM THIS IP, PLEASE TRY AGAIN AFTER 15 MINUTES.",
  },
  statusCode: 429,
});

const uploadDir = path.join(__dirname, "../temp/upload");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function fileFilter(
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  const allowedTypes = [
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only MP4, MOV, AVI and WEBM video formats are allowed."),
    );
  }

  cb(null, true);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024,
  },
});
