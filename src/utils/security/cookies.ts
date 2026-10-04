import type { CookieOptions, Response } from "express";
import { env, isProduction } from "../../config/env.js";

export const REFRESH_COOKIE = "refresh_token";

const base = (): CookieOptions => ({
    httpOnly: true,                 
    secure: isProduction,           
    sameSite: env.COOKIE_SAMESITE,
    path: "/api/auth",
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
});

export const setRefreshCookie = (res: Response, token: string, expiresAt: Date) => {
    res.cookie(REFRESH_COOKIE, token, { ...base(), expires: expiresAt });
};

export const clearRefreshCookie = (res: Response) => {
    res.clearCookie(REFRESH_COOKIE, base());
};
