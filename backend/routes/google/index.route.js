const express = require("express");
const router = express.Router();
const routerRateLimiter = require("@configs/ratelimit.config");
const passport = require("passport");
const {
  google,
  front_google_register,
  front_google_login,
} = require("@controllers/google.controller");
const { body } = require("express-validator");

const registerValidator = [
  body("name")
    .trim()
    .isString()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username should be between 3 to 50 characters."),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address."),
];

const loginValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address."),
];

// Through Backend

router.get(
  "/auth/google",
  routerRateLimiter,
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  routerRateLimiter,
  passport.authenticate("google"),
  google
);

// Through Frontend

router.post(
  "/handler/register",
  routerRateLimiter,
  registerValidator,
  front_google_register
);

router.post(
  "/handler/login",
  routerRateLimiter,
  loginValidator,
  front_google_login
);

module.exports = router;
