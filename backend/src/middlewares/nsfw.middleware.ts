import { Request, Response, NextFunction } from "express";
import { AppError, asyncHandler } from "@utils/essentials.util";
import { isNSFW, moderateFrame } from "@configs/nsfw.config";
import ffmpeg from "fluent-ffmpeg";
import { readdir, ensureDir, remove, readFile } from "fs-extra";
import path from "path";
import { randomUUID } from "crypto";

const MAX_FRAMES_TO_CHECK = 300;
const NSFW_RATIO_THRESHOLD = 0.3; 

const isValidVideo = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file?.path) {
      return next(new AppError("File not provided.", 400));
    }

    const uploadId = randomUUID();
    const framesDir = path.join("temp", uploadId);

    await ensureDir(framesDir);

    try {
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

      if (frameFiles.length > MAX_FRAMES_TO_CHECK) {
        const step = Math.ceil(frameFiles.length / MAX_FRAMES_TO_CHECK);
        frameFiles = frameFiles.filter((_, i) => i % step === 0);
      }

      let nsfwCount = 0;

      for (const fr of frameFiles) {
        const frameBuffer = await readFile(path.join(framesDir, fr));
        const predictions = await moderateFrame(frameBuffer);

        if (isNSFW(predictions)) {
          nsfwCount++;
        }
      }

      const ratio = nsfwCount / frameFiles.length;

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
      await remove(req.file.path).catch((e) => { console.error("Error while cleaning the file path:", e)});
      await remove(framesDir).catch((e) => { console.error("Error while removing frame dir:",e)});
    }
  },
);

export default isValidVideo;
