import { Router } from "express";
import isAuthenticated from "@middlewares/user.middleware";
import verifyCsrf from "@middlewares/csrf.middleware";
import {
  addOrigins,
  create,
  regenerateAccessToken,
  removeMediaCollection,
  removeOrigin,
} from "@controllers/mediaController/index.controller";
import { routerRateLImiter } from "@configs/essential.config";
import isVerifiedMediaCollection from "@middlewares/accessToken.middleware";

export const router = Router();

router.post("/create", isAuthenticated, verifyCsrf, routerRateLImiter, create);

router.patch(
  "/:id/regenrateAccessToken",
  isAuthenticated,
  verifyCsrf,
  routerRateLImiter,
  regenerateAccessToken,
);

router.post(
  "/:id/addorigin",
  isAuthenticated,
  verifyCsrf,
  isVerifiedMediaCollection,
  routerRateLImiter,
  addOrigins,
);

router.delete(
  "/:id/removeorigin",
  isAuthenticated,
  verifyCsrf,
  isVerifiedMediaCollection,
  routerRateLImiter,
  removeOrigin,
);

router.delete("/:id", isAuthenticated, verifyCsrf, isVerifiedMediaCollection, routerRateLImiter, removeMediaCollection);