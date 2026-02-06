import { Router } from "express";
import isAuthenticated from "@middlewares/user.middleware";
import verifyCsrf from "@middlewares/csrf.middleware";
import {
    addOrigins,
  create,
  regenerateAccessToken,
} from "@controllers/mediaController/index.controller";
import { routerRateLImiter } from "@configs/essential.config";
import isVerifiedMediaCollection from "@middlewares/accessToken.middleware";

export const router = Router();

router.post("/create", isAuthenticated, verifyCsrf, routerRateLImiter, create);

router.patch(
  "/:mediaCollectionId/regenrateAccessToken",
  isAuthenticated,
  verifyCsrf,
  routerRateLImiter,
  regenerateAccessToken,
);

router.post("/:mediaCollectionId/addorigin", isAuthenticated, verifyCsrf, isVerifiedMediaCollection, routerRateLImiter, addOrigins);