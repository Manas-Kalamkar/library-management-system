import { createHash, randomBytes, randomUUID } from "node:crypto";
import prisma from "../config/prisma.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import {
    findRefreshTokenByHash,
    purgeRefreshTokens,
    revokeAllTokensForUser,
    revokeTokenFamily,
} from "../repositories/token.repository.js";
import { AppError } from "../utils/AppError.js";
import { signAccessToken, type AuthUser } from "../utils/security/jwt.js";

export interface ClientMeta {
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
}

export interface IssuedTokens {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    refreshExpiresAt: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Refresh tokens are opaque 384-bit random strings. Only their SHA-256 hash is
// stored: the raw value exists only in the user's httpOnly cookie.
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const generateToken = () => randomBytes(48).toString("base64url");

const invalidRefreshToken = () =>
    new AppError("Invalid or expired refresh token", 401, "REFRESH_TOKEN_INVALID");

const truncate = (value: string | undefined, max: number) => value?.slice(0, max);

/** Start a brand-new login chain (called on login / password change). */
export const issueTokens = async (user: AuthUser, meta: ClientMeta = {}): Promise<IssuedTokens> => {
    const now = Date.now();
    const refreshToken = generateToken();
    const absoluteExpiresAt = new Date(now + env.REFRESH_ABSOLUTE_TTL_DAYS * DAY_MS);
    const expiresAt = new Date(Math.min(now + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS, absoluteExpiresAt.getTime()));

    await prisma.refreshToken.create({
        data: {
            tokenHash: hashToken(refreshToken),
            familyId: randomUUID(),
            userId: user.id,
            expiresAt,
            absoluteExpiresAt,
            userAgent: truncate(meta.userAgent, 255) ?? null,
            ipAddress: truncate(meta.ipAddress, 64) ?? null,
        },
    });

    return {
        accessToken: signAccessToken(user),
        expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
        refreshToken,
        refreshExpiresAt: expiresAt,
    };
};

/**
 * Exchange a refresh token for a new access + refresh token pair.
 *
 * - The presented token is single-use: it is revoked and replaced.
 * - If an already-used token is presented again outside a short grace window
 *   we assume it was stolen and revoke the whole chain (reuse detection).
 * - The role is re-read from the database, so role changes apply on refresh.
 */
export const rotateRefreshToken = async (rawToken: string, meta: ClientMeta = {}) => {
    const existing = await findRefreshTokenByHash(hashToken(rawToken));
    if (!existing) throw invalidRefreshToken();

    const now = new Date();

    if (existing.revokedAt) {
        const withinGrace =
            existing.replacedById !== null &&
            now.getTime() - existing.revokedAt.getTime() < env.REFRESH_REUSE_GRACE_SECONDS * 1000;

        if (!withinGrace) {
            await revokeTokenFamily(existing.familyId);
            logger.warn(
                { userId: existing.userId, familyId: existing.familyId, ip: meta.ipAddress },
                "Refresh token reuse detected - token family revoked",
            );
        }
        throw invalidRefreshToken();
    }

    if (existing.expiresAt <= now || existing.absoluteExpiresAt <= now) throw invalidRefreshToken();

    const user = await prisma.user.findUnique({
        where: { id: existing.userId },
        select: { id: true, role: true, email: true, userName: true },
    });
    if (!user) {
        await revokeTokenFamily(existing.familyId);
        throw invalidRefreshToken();
    }

    const newRawToken = generateToken();
    const expiresAt = new Date(
        Math.min(now.getTime() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS, existing.absoluteExpiresAt.getTime()),
    );

    const rotated = await prisma.$transaction(async (tx) => {
        // Atomic claim: if two requests race with the same token, only one wins.
        const claimed = await tx.refreshToken.updateMany({
            where: { id: existing.id, revokedAt: null },
            data: { revokedAt: now },
        });
        if (claimed.count === 0) return false;

        const next = await tx.refreshToken.create({
            data: {
                tokenHash: hashToken(newRawToken),
                familyId: existing.familyId,
                userId: user.id,
                expiresAt,
                absoluteExpiresAt: existing.absoluteExpiresAt,
                userAgent: truncate(meta.userAgent, 255) ?? null,
                ipAddress: truncate(meta.ipAddress, 64) ?? null,
            },
        });
        await tx.refreshToken.update({ where: { id: existing.id }, data: { replacedById: next.id } });
        return true;
    });

    if (!rotated) throw invalidRefreshToken();

    return {
        user: { id: user.id, email: user.email, userName: user.userName, role: user.role },
        tokens: {
            accessToken: signAccessToken({ id: user.id, role: user.role }),
            expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
            refreshToken: newRawToken,
            refreshExpiresAt: expiresAt,
        } satisfies IssuedTokens,
    };
};

/** Log out the device that owns this refresh token (whole chain). Idempotent. */
export const revokeRefreshToken = async (rawToken: string) => {
    const existing = await findRefreshTokenByHash(hashToken(rawToken));
    if (existing) await revokeTokenFamily(existing.familyId);
};

/** Log out everywhere. */
export const revokeAllUserTokens = (userId: string) => revokeAllTokensForUser(userId);

export const purgeExpiredTokens = async () => {
    const { count } = await purgeRefreshTokens(new Date(Date.now() - 7 * DAY_MS));
    if (count > 0) logger.info({ count }, "Purged expired refresh tokens");
};
