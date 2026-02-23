import { Router } from "express";
import verifyCSRF from "@middlewares/csrf.middleware"
import isAuthenticated from "@middlewares/user.middleware"
import { upload } from "@configs/essential.config";
import isValidVideo from "@middlewares/nsfw.middleware";
import { stream, refresh, requestVideo, uploadToBack } from "@controllers/video/video.controller";
import isVerifiedMediaCollection from "@middlewares/accessToken.middleware";
import verifyCookie from "@middlewares/verifyCookie.middleware";

export const router = Router();

router.post("/:id/upload", isAuthenticated, isVerifiedMediaCollection, verifyCSRF, upload.single("video"), isValidVideo, uploadToBack);

router.get("/:id/request/:videoId", isAuthenticated, isVerifiedMediaCollection,verifyCSRF, requestVideo);

router.get("/:id/stream/:videoId", isVerifiedMediaCollection, verifyCookie, stream);

router.get("/:id/refresh/stream", isAuthenticated, isVerifiedMediaCollection,verifyCSRF, refresh);