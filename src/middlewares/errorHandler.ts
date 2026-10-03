import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";
import { isProduction } from "../config/env.js";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/AppError.js";
import { ValidationError } from "../utils/ValidationError.js";
import { DatabaseError } from "../utils/DatabaseError.js";

interface HttpLikeError extends Error {
    status?: number;
    statusCode?: number;
    expose?: boolean;
}

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);

    let statusCode = 500;
    let message = "Internal Server Error";
    let code: string | undefined;
    let details: unknown;

    if (err instanceof ValidationError) {
        statusCode = err.statusCode;
        message = err.message;
        details = err.details;
    } else if (err instanceof DatabaseError) {
        statusCode = err.statusCode;
        message = err.message;
        // Connection strings / driver messages are internal: only show them while developing.
        if (!isProduction) details = err.details;
    } else if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code;
    } else if (err instanceof ZodError) {
        statusCode = 400;
        message = "Invalid Input";
        details = err.issues;
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Safety net for Prisma errors a service did not translate itself.
        if (err.code === "P2002") { statusCode = 409; message = "Resource already exists"; }
        else if (err.code === "P2025") { statusCode = 404; message = "Resource not found"; }
        else if (err.code === "P2003") { statusCode = 409; message = "Operation conflicts with related records"; }
    } else {
        // body-parser errors (malformed JSON, payload too large, ...) carry a safe 4xx status.
        const httpErr = err as HttpLikeError;
        const status = httpErr.statusCode ?? httpErr.status;
        if (typeof status === "number" && status >= 400 && status < 500 && httpErr.expose) {
            statusCode = status;
            message = status === 413 ? "Payload too large" : "Malformed request";
        }
    }

    if (statusCode >= 500) {
        (req.log ?? logger).error({ err }, "Unhandled error");
    }

    if (statusCode === 401) res.set("WWW-Authenticate", "Bearer");
    if (statusCode === 429 || statusCode === 503) res.set("Retry-After", "60");

    return res.status(statusCode).json({
        status: statusCode,
        message,
        ...(code && { code }),
        ...(details !== undefined && { details }),
        ...(req.id !== undefined && { requestId: String(req.id) }),
    });
};
