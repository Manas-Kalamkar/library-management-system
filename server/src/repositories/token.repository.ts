import prisma from "../config/prisma.js";

export const findRefreshTokenByHash = (tokenHash: string) =>
    prisma.refreshToken.findUnique({ where: { tokenHash } });

/** Revoke every still-active token of one login chain. */
export const revokeTokenFamily = (familyId: string) =>
    prisma.refreshToken.updateMany({
        where: { familyId, revokedAt: null },
        data: { revokedAt: new Date() },
    });

export const revokeAllTokensForUser = (userId: string) =>
    prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
    });

/** Housekeeping: drop expired tokens and revoked tokens older than `revokedOlderThan`. */
export const purgeRefreshTokens = (revokedOlderThan: Date) =>
    prisma.refreshToken.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: new Date() } },
                { revokedAt: { lt: revokedOlderThan } },
            ],
        },
    });
