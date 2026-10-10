import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env.js";
import { AppError } from "../AppError.js";

export type Role = "BORROWER" | "LIBRARIAN" | "ADMIN";

export interface AuthUser {
    id: string;
    role: Role;
}

const ALGORITHM = "HS256" as const;

const PayloadSchema = z.object({
    sub: z.string().min(1),
    role: z.enum(["BORROWER", "LIBRARIAN", "ADMIN"]),
});

export const signAccessToken = (user: AuthUser) =>
    jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, {
        algorithm: ALGORITHM,
        subject: user.id,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
        expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
        jwtid: randomUUID(),
    });

export const verifyAccessToken = (token: string): AuthUser => {
    let decoded: string | jwt.JwtPayload;
    try {
        decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
            // Pin the algorithm: blocks "alg: none" and RS/HS confusion attacks.
            algorithms: [ALGORITHM],
            issuer: env.JWT_ISSUER,
            audience: env.JWT_AUDIENCE,
            clockTolerance: 5,
        });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new AppError("Access token expired", 401, "TOKEN_EXPIRED");
        }
        throw new AppError("Invalid access token", 401, "TOKEN_INVALID");
    }

    const payload = PayloadSchema.safeParse(decoded);
    if (!payload.success) throw new AppError("Invalid access token", 401, "TOKEN_INVALID");

    return { id: payload.data.sub, role: payload.data.role };
};
