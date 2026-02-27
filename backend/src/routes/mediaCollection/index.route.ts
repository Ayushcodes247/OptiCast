/**
 * ---------------------------------------------------------
 * MEDIA COLLECTION ROUTES
 * ---------------------------------------------------------
 * Handles:
 * - Media collection creation & deletion
 * - Access token regeneration
 * - Allowed origin management
 * - Playback UI settings
 *
 * Security layers used:
 * - User authentication (JWT)
 * - CSRF protection
 * - Media collection access token verification
 * - Cookie-based playback verification (public embedding)
 * ---------------------------------------------------------
 */

import { Router } from "express";
import isAuthenticated from "@middlewares/user.middleware";
import verifyCsrf from "@middlewares/csrf.middleware";
import {
  addOrigins,
  create,
  getSettings,
  regenerateAccessToken,
  removeMediaCollection,
  removeOrigin,
  setting,
} from "@controllers/mediaController/index.controller";
import { routerRateLImiter } from "@configs/essential.config";
import isVerifiedMediaCollection from "@middlewares/accessToken.middleware";
import verifyCookie from "@middlewares/verifyCookie.middleware";

export const router = Router();

/**
 * Create a new media collection
 * - Authenticated user only
 * - CSRF protected
 */
router.post("/create", isAuthenticated, verifyCsrf, routerRateLImiter, create);

/**
 * Regenerate media collection access token
 * - Owner only
 */
router.patch(
  "/:id/regenrateAccessToken",
  isAuthenticated,
  verifyCsrf,
  routerRateLImiter,
  regenerateAccessToken,
);

/**
 * Add allowed origins to media collection
 */
router.post(
  "/:id/addorigin",
  isAuthenticated,
  verifyCsrf,
  isVerifiedMediaCollection,
  routerRateLImiter,
  addOrigins,
);

/**
 * Remove allowed origin from media collection
 */
router.delete(
  "/:id/removeorigin",
  isAuthenticated,
  verifyCsrf,
  isVerifiedMediaCollection,
  routerRateLImiter,
  removeOrigin,
);

/**
 * Update playback UI settings
 * - Speed options
 * - Icon color
 */
router.post(
  "/:id/settings",
  isAuthenticated,
  verifyCsrf,
  isVerifiedMediaCollection,
  routerRateLImiter,
  setting,
);

/**
 * Get playback UI settings (public embed)
 * - Cookie based playback verification
 * - No user auth required
 */
router.get(
  "/:id/settings",
  verifyCookie,
  isVerifiedMediaCollection,
  getSettings,
);

/**
 * Delete entire media collection
 * - Triggers background deletion job
 */
router.delete(
  "/:id",
  isAuthenticated,
  verifyCsrf,
  isVerifiedMediaCollection,
  routerRateLImiter,
  removeMediaCollection,
);
