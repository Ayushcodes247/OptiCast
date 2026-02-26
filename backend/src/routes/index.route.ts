/**
 * ---------------------------------------------------------
 * ROOT ROUTER
 * ---------------------------------------------------------
 * Mounts all domain-specific routers
 * ---------------------------------------------------------
 */

import { Router } from "express";
import { router as GoogleRouter } from "./user/google.route";
import { router as ManualRouter } from "./user/manual.route";
import { router as VideoRouter } from "./video/index.route";
import { router as MediaCollectionRouter } from "./mediaCollection/index.route";
import { routerRateLImiter } from "@configs/essential.config";

export const router = Router();

/**
 * User Authentication Routes (Manual)
 */
router.use("/users", ManualRouter);

/**
 * Google OAuth Routes (Rate Limited)
 */
router.use("/google", routerRateLImiter, GoogleRouter);

/**
 * Video Routes
 */
router.use("/video", VideoRouter);

/**
 * Media Collection Routes
 */
router.use("/media-collection", MediaCollectionRouter);
