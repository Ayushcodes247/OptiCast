require("module-alias/register");

const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();
const connectTODB = require("@configs/DB/db.config");
const checkDBConnection = require("@middlewares/DB/db.middleware");

const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const router = require("@routes/index.route");

const masterRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests, please try again later." },
});

connectTODB();
app.use(checkDBConnection);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet());
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use("/api/v1/", masterRateLimiter , checkDBConnection, router);

app.use((error, req, res, next) => {
  console.error("[App.js] Error stack:", error.stack);
  return res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error.",
  });
});

module.exports = app;
