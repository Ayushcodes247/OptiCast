const express = require("express");
const router = express.Router();
const routerRateLimiter = require("@configs/ratelimit.config");
const passport = require("passport");

router.get('/auth/google', routerRateLimiter, passport.authenticate("google", { scope : ["profile","email"] }));

router.get("/auth/google/callback", routerRateLimiter , passport.authenticate("google"));

router.get("/test", (req,res) => {
    return res.status(200).send({ message : "Hello"})
})

module.exports = router;