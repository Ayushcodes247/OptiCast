const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const routerRateLimiter = require("@configs/ratelimit.config");
const { register, login, profile, logout } = require("@controllers/user.controller");
const { authentication } = require("@middlewares/user/authentication.middleware");

const registerValidator = [
  body("username")
    .trim()
    .isString()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username should be between 3 to 50 characters."),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address."),
  body("password")
    .trim()
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password should be at least 8 characters long."),
];

const loginValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address."),
  body("password")
    .trim()
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password should be at least 8 characters long."),
];

router.post("/register", routerRateLimiter, registerValidator, register);

router.post("/login", routerRateLimiter, loginValidator, login);

router.get("/profile", routerRateLimiter , authentication, profile);

router.post("/logout", routerRateLimiter , authentication , logout);

module.exports = router;
