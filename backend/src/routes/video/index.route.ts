import { Router } from "express";
import verifyCSRF from "@middlewares/csrf.middleware"
import isAuthenticated from "@middlewares/user.middleware"
import { upload } from "@configs/essential.config";
import isValidVideo from "@middlewares/nsfw.middleware";
import { uploadToBack } from "@controllers/video/video.controller";

export const router = Router();

router.post("/upload", isAuthenticated, verifyCSRF, upload.single("video"), isValidVideo, uploadToBack);