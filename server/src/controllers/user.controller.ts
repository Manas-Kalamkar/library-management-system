import type { Request, Response } from "express";
import { ChangePasswordData, LoginData, SignupData } from "../schemas/user.schema.js";
import {
    userChangePasswordService,
    userDeleteService,
    userLoginService,
    userSignupService,
    userStatusService,
} from "../services/user.service.js";
import {
    revokeAllUserTokens,
    revokeRefreshToken,
    rotateRefreshToken,
    type ClientMeta,
    type IssuedTokens,
} from "../services/token.service.js";
import { AppError } from "../utils/AppError.js";
import { ValidationError } from "../utils/ValidationError.js";
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from "../utils/security/cookies.js";

const clientMeta = (req: Request): ClientMeta => ({
    userAgent: req.get("user-agent"),
    ipAddress: req.ip,
});

/**
 * The refresh token goes into an httpOnly cookie (never into the JSON body, so
 * JavaScript - and therefore XSS - can't read it). The short-lived access token
 * is returned in the body for the client to keep in memory and send as a Bearer token.
 */
const startSession = (res: Response, tokens: IssuedTokens) => {
    setRefreshCookie(res, tokens.refreshToken, tokens.refreshExpiresAt);
    return {
        accessToken: tokens.accessToken,
        tokenType: "Bearer" as const,
        expiresIn: tokens.expiresIn,
    };
};

export const userSignupController = async (req: Request, res: Response) => {
    const data = SignupData.safeParse(req.body);
    if (!data.success) throw new ValidationError("Invalid Input", data.error.issues);

    const user = await userSignupService(data.data);
    return res.status(201).json(user);
};

export const userLoginController = async (req: Request, res: Response) => {
    const data = LoginData.safeParse(req.body);
    if (!data.success) throw new ValidationError("Invalid Input", data.error.issues);

    const { user, tokens } = await userLoginService(data.data, clientMeta(req));
    return res.status(200).json({ user, ...startSession(res, tokens) });
};

export const userRefreshController = async (req: Request, res: Response) => {
    const rawToken: unknown = req.cookies?.[REFRESH_COOKIE];
    if (typeof rawToken !== "string" || !rawToken) {
        throw new AppError("Refresh token missing", 401, "REFRESH_TOKEN_MISSING");
    }

    try {
        const { user, tokens } = await rotateRefreshToken(rawToken, clientMeta(req));
        return res.status(200).json({ user, ...startSession(res, tokens) });
    } catch (error) {
        clearRefreshCookie(res); // a rejected token is useless; don't keep resending it
        throw error;
    }
};

/** Works even when the access token has already expired, and is safe to call twice. */
export const userLogoutController = async (req: Request, res: Response) => {
    const rawToken: unknown = req.cookies?.[REFRESH_COOKIE];
    if (typeof rawToken === "string" && rawToken) await revokeRefreshToken(rawToken);

    clearRefreshCookie(res);
    return res.status(200).json({ message: "User Logged Out" });
};

export const userLogoutAllController = async (req: Request, res: Response) => {
    await revokeAllUserTokens(req.user!.id);
    clearRefreshCookie(res);
    return res.status(200).json({ message: "Logged out from all devices" });
};

export const userStatusController = async (req: Request, res: Response) => {
    const user = await userStatusService(req.user!.id);
    return res.status(200).json(user);
};

export const userChangePasswordController = async (req: Request, res: Response) => {
    const data = ChangePasswordData.safeParse(req.body);
    if (!data.success) throw new ValidationError("Invalid Input", data.error.issues);

    const tokens = await userChangePasswordService(req.user!.id, data.data, clientMeta(req));
    return res.status(200).json({ message: "Password changed. Other devices were logged out.", ...startSession(res, tokens) });
};

export const userDeleteController = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const actor = req.user!;

    // Users may delete themselves; admins may delete anyone else (but not themselves, to avoid lock-out).
    const isSelf = actor.id === id;
    if (actor.role === "ADMIN" ? isSelf : !isSelf) {
        throw new AppError(
            isSelf ? "Admins cannot delete their own account." : "Unauthorized to delete other users.",
            403,
            "FORBIDDEN",
        );
    }

    await userDeleteService(id);
    if (isSelf) clearRefreshCookie(res);
    return res.status(204).send();
};

