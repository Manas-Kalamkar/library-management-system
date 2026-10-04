import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

/**
 * Defence in depth for the endpoints that rely on the refresh cookie
 * (refresh / logout). SameSite already blocks cross-site cookie sends in modern
 * browsers; this additionally rejects state-changing requests whose Origin
 * header is present but not on our allow-list. Requests with no Origin
 * (curl, mobile apps, same-origin tools) are not browser CSRF vectors and pass.
 */
export const requireTrustedOrigin = (req: Request, _res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && !env.CORS_ORIGINS.includes(origin)) {
        throw new AppError("Origin not allowed", 403, "ORIGIN_NOT_ALLOWED");
    }
    next();
};

/** Auth responses carry tokens: make sure no proxy or browser caches them. */
export const noStore = (_req: Request, res: Response, next: NextFunction) => {
    res.set("Cache-Control", "no-store");
    next();
};
