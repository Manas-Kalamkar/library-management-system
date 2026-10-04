import * as z from "zod";

/** Trimmed, lower-cased, validated e-mail (so "A@x.com" and "a@x.com" are the same account). */
export const EmailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

/**
 * bcrypt only uses the first 72 bytes, so cap there rather than silently truncating.
 * Length matters more than composition; we only require a letter and a digit.
 */
export const PasswordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine((v) => Buffer.byteLength(v, "utf8") <= 72, "Password must be at most 72 bytes")
    .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Password must contain at least one letter and one number");

export const NameSchema = z.string().trim().min(1).max(100);

export const IdSchema = z.string().trim().min(1).max(64);
