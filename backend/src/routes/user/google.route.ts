import { googleAuth } from "@controllers/user/google.controller";
import { Router } from "express";

export const router = Router();

router.post("/", googleAuth);