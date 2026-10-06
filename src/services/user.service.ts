import { env } from "../config/env.js";
import {
    addUser,
    deleteUser,
    findUserById,
    findUserByEmail,
    findUserWithPasswordById,
    registerFailedLogin,
    registerSuccessfulLogin,
    updatePassword,
} from "../repositories/user.repository.js";
import type { ChangePasswordDataType, LoginDataType, SignupDataType } from "../schemas/user.schema.js";
import { AppError } from "../utils/AppError.js";
import { handlePrismaError } from "../utils/prismaErrors.js";
import { compareAgainstDummy, comparePassword, hashPassword, needsRehash } from "../utils/security/password.js";
import { issueTokens, revokeAllUserTokens, type ClientMeta } from "./token.service.js";

const invalidCredentials = () => new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

export const getUserService = async (id: string) => {
    const user = await findUserById(id);
    if (!user) throw new AppError("User not found.", 404);
    return user;
};

export const userSignupService = async (data: SignupDataType) => {
    const password = await hashPassword(data.password);
    try {
        return await addUser({ ...data, password });
    } catch (error) {
        return handlePrismaError(error, { P2002: "User already exists." });
    }
};

export const userLoginService = async ({ email, password }: LoginDataType, meta: ClientMeta) => {
    const user = await findUserByEmail(email);

    // Same error, same cost for "no such user", "locked" and "wrong password":
    // nothing in the response reveals which emails are registered.
    if (!user || (user.lockedUntil && user.lockedUntil > new Date())) {
        await compareAgainstDummy(password);
        throw invalidCredentials();
    }

    if (!(await comparePassword(password, user.password))) {
        await registerFailedLogin(user.id, env.MAX_FAILED_LOGINS, env.LOCKOUT_MINUTES * 60_000);
        throw invalidCredentials();
    }

    // Transparently upgrade old hashes if BCRYPT_ROUNDS was raised.
    await registerSuccessfulLogin(user.id, needsRehash(user.password) ? await hashPassword(password) : undefined);

    const tokens = await issueTokens({ id: user.id, role: user.role }, meta);

    return {
        user: { id: user.id, email: user.email, userName: user.userName, role: user.role },
        tokens,
    };
};

export const userChangePasswordService = async (
    userId: string,
    { currentPassword, newPassword }: ChangePasswordDataType,
    meta: ClientMeta,
) => {
    const user = await findUserWithPasswordById(userId);
    if (!user) throw new AppError("User no longer exists", 401, "UNAUTHENTICATED");

    if (!(await comparePassword(currentPassword, user.password))) {
        throw new AppError("Current password is incorrect", 403, "INVALID_CURRENT_PASSWORD");
    }
    if (currentPassword === newPassword) {
        throw new AppError("New password must be different from the current password", 400);
    }

    await updatePassword(userId, await hashPassword(newPassword));

    // Every device must log in again with the new password; this device gets a fresh session.
    await revokeAllUserTokens(userId);
    return issueTokens({ id: user.id, role: user.role }, meta);
};

export const userDeleteService = async (id: string) => {
    try {
        return await deleteUser(id);
    } catch (error) {
        return handlePrismaError(error, {
            P2025: "User not found.",
            P2003: "User cannot be deleted because related records exist.",
        });
    }
};

export const userStatusService = async (id: string) => {
    const user = await findUserById(id);
    if (!user) throw new AppError("User no longer exists", 401, "UNAUTHENTICATED");
    return user;
};
