import { Router } from "express";
import { login, logout, profile, register } from "@controllers/user/manual.controller";
import { routerRateLImiter } from "@configs/essential.config";
import { body, ValidationChain } from "express-validator";
import isAuthenticated from "@middlewares/user.middleware";
import verifyCsrf from "@middlewares/csrf.middleware";

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

router.post("/register", routerRateLImiter, registerBodyValidator, register);

router.post("/login", routerRateLImiter, loginBodyValidator,login);

router.get("/profile", routerRateLImiter, isAuthenticated, verifyCsrf, profile);

router.post("/logout", routerRateLImiter, isAuthenticated, verifyCsrf, logout);