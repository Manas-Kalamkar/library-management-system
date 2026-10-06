import prisma from "../config/prisma.js";

export const publicUserSelect = {
    id: true,
    email: true,
    userName: true,
    role: true,
} as const;

export const addUser = (data: { userName: string; email: string; password: string; phoneNo: string }) =>
    prisma.user.create({
        data: {
            userName: data.userName,
            email: data.email,
            password: data.password,
            role: "BORROWER", // public signup can only ever create borrowers
            borrowers: {
                create: {
                    name: data.userName,
                    phoneNo: data.phoneNo,
                },
            },
        },
        select: publicUserSelect,
    });

/** Includes the password hash - for the auth service only, never return it to clients. */
export const findUserByEmail = (email: string) => prisma.user.findUnique({ where: { email } });

export const findUserById = (id: string) =>
    prisma.user.findUnique({ where: { id }, select: publicUserSelect });

export const findUserWithPasswordById = (id: string) => prisma.user.findUnique({ where: { id } });

export const deleteUser = (id: string) =>
    prisma.user.delete({
        where: { id },
        select: { userName: true, email: true, role: true },
    });

export const updatePassword = (id: string, password: string) =>
    prisma.user.update({ where: { id }, data: { password }, select: { id: true } });

/** Atomically count a failed login; lock the account when the limit is hit. */
export const registerFailedLogin = async (id: string, maxAttempts: number, lockMs: number) => {
    const { failedLoginAttempts } = await prisma.user.update({
        where: { id },
        data: { failedLoginAttempts: { increment: 1 } },
        select: { failedLoginAttempts: true },
    });

    if (failedLoginAttempts >= maxAttempts) {
        await prisma.user.update({
            where: { id },
            data: { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + lockMs) },
        });
    }
};

export const registerSuccessfulLogin = (id: string, newPasswordHash?: string) =>
    prisma.user.update({
        where: { id },
        data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
            ...(newPasswordHash && { password: newPasswordHash }),
        },
        select: { id: true },
    });
