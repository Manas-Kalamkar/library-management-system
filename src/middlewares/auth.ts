import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken, type Role } from "../utils/security/jwt.js";

const BEARER = /^Bearer\s+(\S+)$/i;

/** Verifies the `Authorization: Bearer <accessToken>` header and sets `req.user`. */
export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
    const match = BEARER.exec(req.headers.authorization ?? "");
    if (!match?.[1]) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");

    req.user = verifyAccessToken(match[1]);
    next();
};

/** Must run after requireAuth. */
export const requireRole = (allowedRoles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const role = req.user?.role;

        if (!role || !allowedRoles.includes(role)) {
            throw new AppError("Forbidden: You do not have permission to perform this action.", 403, "FORBIDDEN");
        }
        next();
    };
};
