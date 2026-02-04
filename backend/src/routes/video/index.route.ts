import { Router } from "express";
import verifyCSRF from "@middlewares/csrf.middleware"
import isAuthenticated from "@middlewares/user.middleware"
import { upload } from "@configs/essential.config";
import isValidVideo from "@middlewares/nsfw.middleware";
import { playback, refresh, uploadToBack } from "@controllers/video/video.controller";

export const router = Router();

router.post("/upload", isAuthenticated, verifyCSRF, upload.single("video"), isValidVideo, uploadToBack);

router.get("/playback/:videoId", isAuthenticated, verifyCSRF, playback);

router.get("/refresh/palyback", isAuthenticated, verifyCSRF, refresh);