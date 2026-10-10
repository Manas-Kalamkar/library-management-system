/**
 * Creates the first ADMIN account (public signup can only create borrowers).
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='S3cure-pass-123' ADMIN_NAME='Your Name' npm run create-admin
 */
import { env } from "../config/env.js";
import prisma, { disconnectDB } from "../config/prisma.js";
import { EmailSchema, NameSchema, PasswordSchema } from "../schemas/common.schema.js";
import { hashPassword } from "../utils/security/password.js";

const main = async () => {
    const email = EmailSchema.safeParse(process.env.ADMIN_EMAIL);
    const password = PasswordSchema.safeParse(process.env.ADMIN_PASSWORD);
    const name = NameSchema.safeParse(process.env.ADMIN_NAME ?? "Administrator");

    if (!email.success || !password.success || !name.success) {
        console.error("Set ADMIN_EMAIL, ADMIN_PASSWORD (8-72 chars, letter + number) and optionally ADMIN_NAME.");
        for (const r of [email, password, name]) {
            if (!r.success) console.error(" -", r.error.issues.map((i) => i.message).join("; "));
        }
        process.exitCode = 1;
        return;
    }

    const existing = await prisma.user.findUnique({ where: { email: email.data }, select: { id: true } });
    if (existing) {
        console.error(`A user with e-mail ${email.data} already exists.`);
        process.exitCode = 1;
        return;
    }

    const admin = await prisma.user.create({
        data: {
            userName: name.data,
            email: email.data,
            password: await hashPassword(password.data),
            role: "ADMIN",
        },
        select: { id: true, email: true, role: true },
    });

    console.log(`Admin created (${env.NODE_ENV}):`, admin);
};

main()
    .catch((err) => {
        console.error("Failed to create admin:", err);
        process.exitCode = 1;
    })
    .finally(() => disconnectDB());
