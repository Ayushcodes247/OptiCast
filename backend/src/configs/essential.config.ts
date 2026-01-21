import { rateLimit } from "express-rate-limit";

export const time = (): string => new Date().toISOString();

export const routerRateLImiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: {
    error: "TOO MANY REQUEST FROM THIS IP, PLEASE TRY AGAIN AFTER 15 MINUTES.",
  },
  statusCode: 429,
});
