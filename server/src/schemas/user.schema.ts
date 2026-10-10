import * as z from "zod";
import { EmailSchema, NameSchema, PasswordSchema } from "./common.schema.js";

export const SignupData = z.object({
    userName: NameSchema,
    email: EmailSchema,
    password: PasswordSchema,
    phoneNo: z.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
});

export type SignupDataType = z.infer<typeof SignupData>;

export const LoginData = z.object({
    email: EmailSchema,
    password: z.string().min(1).max(200),
});

export type LoginDataType = z.infer<typeof LoginData>;

export const ChangePasswordData = z.object({
    currentPassword: z.string().min(1).max(200),
    newPassword: PasswordSchema,
});

export type ChangePasswordDataType = z.infer<typeof ChangePasswordData>;
