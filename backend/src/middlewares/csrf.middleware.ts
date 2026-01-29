import { Request, Response, NextFunction } from "express";
import { AppError, asyncHandler } from "@utils/essentials.util";

const CSRF_TOKEN_NAME = "opticast_csrf_token";

const verifyCsrf = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const csrfCookie =
      req.cookies?.[CSRF_TOKEN_NAME] || req.headers["x-csrf-token"];

    if (!csrfCookie) {
      return next(new AppError("CSRF token missing.", 403));
    }

    next();
  },
);

export default verifyCsrf;
