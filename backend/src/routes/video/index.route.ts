import { Router } from "express";
import verifyCSRF from "@middlewares/csrf.middleware"
import isAuthenticated from "@middlewares/user.middleware"
import { upload } from "@configs/essential.config";
import isValidVideo from "@middlewares/nsfw.middleware";
import { playback, refresh, uploadToBack } from "@controllers/video/video.controller";
import isVerifiedMediaCollection from "@middlewares/accessToken.middleware";

export const router = Router();

router.post("/:id/upload", isAuthenticated, isVerifiedMediaCollection, verifyCSRF, upload.single("video"), isValidVideo, uploadToBack);

router.get("/:id/playback/:videoId", isAuthenticated, isVerifiedMediaCollection,verifyCSRF, playback);

router.get("/:id/refresh/palyback", isAuthenticated, isVerifiedMediaCollection,verifyCSRF, refresh);