import { Router } from "express";
import { router as GoogleRouter } from "./user/google.route";
import { router as ManualRouter } from "./user/manual.route";
import { router as VideoRouter } from "./video/index.route";
import { routerRateLImiter } from "@configs/essential.config";

export const router = Router();

router.use("/users", routerRateLImiter, ManualRouter);
router.use("/google", routerRateLImiter, GoogleRouter);
router.use("/video", routerRateLImiter, VideoRouter);
