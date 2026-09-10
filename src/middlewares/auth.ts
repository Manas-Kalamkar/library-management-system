import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";



export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) throw new AppError("Unauthorized. Please login first", 401)

    next()
}

export const requireRole = (allowedRole:("LIBRARIAN" | "BORROWER" | "ADMIN")[]) => {

    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.session.role;

        if(!userRole || !allowedRole.includes(userRole)) throw new AppError("Forbidden: You do not have permission to perform this action.",403)
        next()
    }
}