/**
 * ---------------------------------------------------------
 * VIDEO CONTENT VALIDATION MIDDLEWARE
 * ---------------------------------------------------------
 * Workflow:
 * 1. Extract frames using ffmpeg
 * 2. Sample frames (limit to 300)
 * 3. Run NSFW detection
 * 4. Calculate explicit ratio
 * 5. Reject upload if threshold exceeded
 *
 * Protects platform from:
 * - Pornographic uploads
 * - Explicit content abuse
 * ---------------------------------------------------------
 */

import { Request, Response, NextFunction } from "express";
import { AppError, asyncHandler } from "@utils/essentials.util";
import { isNSFW, moderateFrame } from "@configs/nsfw.config";
import ffmpeg from "fluent-ffmpeg";
import { readdir, ensureDir, remove, readFile } from "fs-extra";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Maximum number of frames to analyze
 */
const MAX_FRAMES_TO_CHECK = 300;

/**
 * Reject video if >= 30% frames are NSFW
 */
const NSFW_RATIO_THRESHOLD = 0.3;

const isValidVideo = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file?.path) {
      return next(new AppError("File not provided.", 400));
    }

    /**
     * Create temporary directory for frame extraction
     */
    const uploadId = randomUUID();
    const framesDir = path.join("temp", uploadId);

    await ensureDir(framesDir);

    try {
      /**
       * Extract frames at 1 frame per 2 seconds
       */
      await new Promise<void>((resolve, reject) => {
        ffmpeg(req.file!.path)
          .outputOptions(["-vf", "fps=1/2"])
          .output(path.join(framesDir, "frame-%04d.png"))
          .once("end", resolve)
          .once("error", reject)
          .run();
      });

      let frameFiles = await readdir(framesDir);

      if (!frameFiles.length) {
        throw new AppError("No frames extracted from video.", 400);
      }

      /**
       * Downsample frames if exceeding limit
       */
      if (frameFiles.length > MAX_FRAMES_TO_CHECK) {
        const step = Math.ceil(frameFiles.length / MAX_FRAMES_TO_CHECK);
        frameFiles = frameFiles.filter((_, i) => i % step === 0);
      }

      let nsfwCount = 0;

      /**
       * Analyze each frame
       */
      for (const fr of frameFiles) {
        const frameBuffer = await readFile(path.join(framesDir, fr));
        const predictions = await moderateFrame(frameBuffer);

        if (isNSFW(predictions)) {
          nsfwCount++;

          /**
           * Remove uploaded file immediately if explicit frame detected
           */
          await remove(req.file.path).catch((e) => {
            console.error("Error while cleaning the file path:", e);
          });
        }
      }

      const ratio = nsfwCount / frameFiles.length;

      /**
       * Reject video if explicit ratio exceeds threshold
       */
      if (ratio >= NSFW_RATIO_THRESHOLD) {
        return next(
          new AppError(
            "Video contains significant explicit content. Upload rejected.",
            403,
          ),
        );
      }

      next();
    } finally {
      /**
       * Always clean temporary frame directory
       */
      await remove(framesDir).catch((e) => {
        console.error("Error while removing frame dir:", e);
      });
    }
  },
);

export default isValidVideo;
