/**
 * ---------------------------------------------------------
 * MANUAL AUTH ROUTES
 * ---------------------------------------------------------
 */

import { Router } from "express";
import {
  login,
  logout,
  profile,
  register,
} from "@controllers/user/manual.controller";
import { routerRateLImiter } from "@configs/essential.config";
import { body, ValidationChain } from "express-validator";
import isAuthenticated from "@middlewares/user.middleware";
import verifyCsrf from "@middlewares/csrf.middleware";

/**
 * Request Validators
 */
const registerBodyValidator: ValidationChain[] = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username should be between 3 to 50 characters."),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address."),

  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password should be at least 8 characters long."),
];

const loginBodyValidator: ValidationChain[] = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address."),

  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password should be at least 8 characters long."),
];

export const router = Router();

/**
 * Register
 */
router.post("/register", routerRateLImiter, registerBodyValidator, register);

/**
 * Login
 */
router.post("/login", routerRateLImiter, loginBodyValidator, login);

/**
 * Get Profile (Authenticated + CSRF Protected)
 */
router.get("/profile", routerRateLImiter, isAuthenticated, verifyCsrf, profile);

/**
 * Logout
 */
router.post("/logout", routerRateLImiter, isAuthenticated, verifyCsrf, logout);
