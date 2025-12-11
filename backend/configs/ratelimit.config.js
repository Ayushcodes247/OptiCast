const { rateLimit } = require("express-rate-limit");

const routerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many requests, please try again later." },
});

module.exports = routerRateLimiter;