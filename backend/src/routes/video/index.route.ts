import { Router } from "express";
import verifyCSRF from "@middlewares/csrf.middleware"
import isAuthenticated from "@middlewares/user.middleware"

export const router = Router();

router.post("/upload", verifyCSRF, isAuthenticated);