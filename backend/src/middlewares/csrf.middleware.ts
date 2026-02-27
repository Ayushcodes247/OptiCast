import { Request, Response, NextFunction } from "express";
import { AppError, asyncHandler } from "@utils/essentials.util";

/**
 * Name of the CSRF token stored in cookies.
 * This should match whatever your frontend sets.
 */
const CSRF_TOKEN_NAME = "opticast_csrf_token";

/**
 * CSRF Verification Middleware
 *
 * Purpose:
 * - Ensures that a CSRF token is present in either:
 *   1. Cookies
 *   2. Request headers (x-csrf-token)
 *
 * Note:
 * - This middleware ONLY checks for existence of the token.
 * - It does NOT validate or compare token values.
 * - If you want stronger CSRF protection, you should verify
 *   the token against a stored/expected value.
 */
const verifyCsrf = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    /**
     * Try to read CSRF token from:
     * 1. Cookie
     * 2. Custom header (x-csrf-token)
     */
    const csrfCookie =
      req.cookies?.[CSRF_TOKEN_NAME] || req.headers["x-csrf-token"];

    // If token is missing → block the request
    if (!csrfCookie) {
      return next(new AppError("CSRF token missing.", 403));
    }

    // Token exists → allow request to proceed
    next();
  },
);

export default verifyCsrf;
