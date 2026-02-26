/**
 * ---------------------------------------------------------
 * EXPRESS APPLICATION CONFIGURATION
 * ---------------------------------------------------------
 * - Security middlewares
 * - CORS
 * - Cookie parsing
 * - Static HLS protection
 * - Rate limiting
 * - API routing
 * - Global error handling
 * ---------------------------------------------------------
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import {
  globalErrorHandler,
  checkDBConnection,
} from "@middlewares/essentials.middleware";
import { env } from "@configs/env.config";
import { rateLimit } from "express-rate-limit";
import { router as IndexRouter } from "@routes/index.route";
import path from "path";
import verifyCookie from "@middlewares/verifyCookie.middleware";

const app = express();

/**
 * Security Headers
 */
app.use(helmet());
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));

/**
 * CORS Configuration
 * Allows frontend domain with credentials support
 */
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  }),
);

/**
 * Cookie Parser
 * Required before accessing req.cookies or req.signedCookies
 */
app.use(cookieParser(env.COOKIE_SECRET));

/**
 * Body Parsers
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/**
 * Protected HLS Static Serving
 * Every file inside /hls must pass verifyCookie middleware
 */
app.use("/hls", verifyCookie, express.static(path.join(__dirname, "hls")));

/**
 * API Rate Limiter
 * Applied to all /api routes
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later.",
  },
});

/**
 * Main API Router
 */
app.use("/api", apiRateLimiter, checkDBConnection, IndexRouter);

/**
 * Global Error Handler (must be last)
 */
app.use(globalErrorHandler);

export default app;
