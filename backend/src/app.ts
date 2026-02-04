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

const app = express();

app.use(helmet());
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later.",
  },
});

app.use("/api", apiRateLimiter, checkDBConnection, IndexRouter);

app.use(globalErrorHandler);

export default app;
