const express = require("express");
const router = express.Router();
const routerRateLimiter = require("@configs/ratelimit.config");
const passport = require("passport");
const { google } = require("@controllers/google.controller");
const { body } = require("express-validator");

const handlerValidator = [
  body("user").isObject().withMessage("User object not provided."),
  body("token")
    .isString()
    .trim()
    .withMessage("Please provide a valid authentication token."),
];

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

router.post("/handler", routerRateLimiter, );

module.exports = router;
