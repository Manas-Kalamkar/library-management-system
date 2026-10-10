import "dotenv/config";
import { z } from "zod";

const csv = (value: string) =>
    value.split(",").map((v) => v.trim()).filter(Boolean);

const EnvSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),

    // --- JWT ---------------------------------------------------------------
    // 32+ chars of randomness. Generate with:
    //   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    JWT_ISSUER: z.string().min(1).default("library-management-system"),
    JWT_AUDIENCE: z.string().min(1).default("library-management-api"),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900), // 15 min
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
    // Hard cap on how long one login chain may be kept alive by refreshing.
    REFRESH_ABSOLUTE_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
    // Concurrent refreshes (e.g. two browser tabs) within this window are not treated as theft.
    REFRESH_REUSE_GRACE_SECONDS: z.coerce.number().int().min(0).max(60).default(10),

    // --- Passwords / lockout ----------------------------------------------
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    MAX_FAILED_LOGINS: z.coerce.number().int().min(3).max(20).default(5),
    LOCKOUT_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),

    // --- HTTP --------------------------------------------------------------
    // Comma separated list of exact origins allowed to call the API from a browser.
    CORS_ORIGINS: z.string().default("").transform(csv),
    COOKIE_SAMESITE: z.enum(["strict", "lax", "none"]).default("strict"),
    COOKIE_DOMAIN: z.string().optional(),
    // Number of reverse proxies in front of the app (needed for correct client IPs).
    TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
    RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),       // per 15 min per IP
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),   // login/signup per 15 min per IP
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment configuration:");
    for (const issue of parsed.error.issues) {
        console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

if (isProduction && env.CORS_ORIGINS.length === 0) {
    console.warn("CORS_ORIGINS is empty: browsers on other origins will be blocked.");
}
if (env.COOKIE_SAMESITE === "none" && !isProduction) {
    console.warn("COOKIE_SAMESITE=none requires HTTPS (Secure cookies) to work in browsers.");
}
