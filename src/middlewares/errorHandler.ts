import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { ValidationError } from "../utils/ValidationError.js";
import { DatabaseError } from "../utils/DatabaseError.js";

export const errorHandler = (err: AppError | ValidationError | DatabaseError, req: Request, res: Response, next: NextFunction) => {

    if (err instanceof ValidationError) {
        return res.status(err.statusCode).json({
            status: err.statusCode || "error",
            message: err.message || "Internal Server Error",
            details: err.details || "No details specified"
        })
    }
    if (err instanceof DatabaseError) {
        return res.status(err.statusCode).json({
            status: err.statusCode || "error",
            message: err.message || "Internal Server Error",
            details: err.details || "No details specified"
        })
    }

    return res.status(err.statusCode || 500).json({
        status: err.statusCode || "error",
        message: err.message || "Internal Server Error"
    })

}   