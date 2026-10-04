import rateLimit from "express-rate-limit";
import { env, isTest } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const build = (limit: number, message: string, skipSuccessfulRequests = false) =>
    rateLimit({
        skipSuccessfulRequests,
        windowMs: FIFTEEN_MINUTES,
        limit,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        skip: () => isTest,
        handler: (_req, _res, next) => next(new AppError(message, 429, "RATE_LIMITED")),
    });

// NOTE: counters live in process memory. If you run more than one instance,
// plug a shared store (e.g. rate-limit-redis) into these limiters.

/** Whole API, per IP. */
export const globalLimiter = build(env.RATE_LIMIT_MAX, "Too many requests, please try again later.");

/** Signup / password change: every call counts. Slows mass account creation. */
export const authLimiter = build(env.AUTH_RATE_LIMIT_MAX, "Too many attempts, please try again later.");

/** Login: only FAILED attempts count, so a busy office behind one IP isn't locked out. */
export const loginLimiter = build(env.AUTH_RATE_LIMIT_MAX, "Too many failed login attempts, please try again later.", true);

/** Token refresh is called automatically by clients so it gets a looser limit. */
export const refreshLimiter = build(env.AUTH_RATE_LIMIT_MAX * 6, "Too many refresh attempts, please try again later.");
