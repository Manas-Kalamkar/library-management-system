import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { env } from "../src/config/env.js";
import { signAccessToken, verifyAccessToken } from "../src/utils/security/jwt.js";
import { AppError } from "../src/utils/AppError.js";

const claims = { sub: "user_1", role: "ADMIN" };
const common = { issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE };

const expectRejected = (fn: () => unknown, code: string) => {
    try {
        fn();
    } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(401);
        expect((err as AppError).code).toBe(code);
        return;
    }
    throw new Error("expected token to be rejected");
};

describe("access tokens", () => {
    it("round-trips id and role", () => {
        const token = signAccessToken({ id: "user_1", role: "LIBRARIAN" });
        expect(verifyAccessToken(token)).toEqual({ id: "user_1", role: "LIBRARIAN" });
    });

    it("is short-lived and carries iss/aud/jti", () => {
        const decoded = jwt.decode(signAccessToken({ id: "u", role: "BORROWER" })) as jwt.JwtPayload;
        expect(decoded.exp! - decoded.iat!).toBe(env.ACCESS_TOKEN_TTL_SECONDS);
        expect(decoded.iss).toBe(env.JWT_ISSUER);
        expect(decoded.aud).toBe(env.JWT_AUDIENCE);
        expect(decoded.jti).toBeTruthy();
    });

    it("rejects an expired token with TOKEN_EXPIRED", () => {
        const token = jwt.sign(claims, env.JWT_ACCESS_SECRET, { ...common, algorithm: "HS256", expiresIn: -60 });
        expectRejected(() => verifyAccessToken(token), "TOKEN_EXPIRED");
    });

    it("rejects a token signed with another secret", () => {
        const token = jwt.sign(claims, "x".repeat(40), { ...common, algorithm: "HS256", expiresIn: 60 });
        expectRejected(() => verifyAccessToken(token), "TOKEN_INVALID");
    });

    it("rejects a tampered payload (privilege escalation attempt)", () => {
        const token = signAccessToken({ id: "user_1", role: "BORROWER" });
        const [h, , s] = token.split(".");
        const forged = Buffer.from(JSON.stringify({ ...claims, iss: env.JWT_ISSUER, aud: env.JWT_AUDIENCE, exp: 9999999999 })).toString("base64url");
        expectRejected(() => verifyAccessToken(`${h}.${forged}.${s}`), "TOKEN_INVALID");
    });

    it('rejects "alg: none" tokens', () => {
        const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
        const payload = Buffer.from(
            JSON.stringify({ ...claims, iss: env.JWT_ISSUER, aud: env.JWT_AUDIENCE, exp: 9999999999 }),
        ).toString("base64url");
        expectRejected(() => verifyAccessToken(`${header}.${payload}.`), "TOKEN_INVALID");
    });

    it("rejects a different algorithm (HS512) even with the right secret", () => {
        const token = jwt.sign(claims, env.JWT_ACCESS_SECRET, { ...common, algorithm: "HS512", expiresIn: 60 });
        expectRejected(() => verifyAccessToken(token), "TOKEN_INVALID");
    });

    it("rejects wrong issuer / audience", () => {
        const badIss = jwt.sign(claims, env.JWT_ACCESS_SECRET, { issuer: "evil", audience: env.JWT_AUDIENCE, expiresIn: 60 });
        const badAud = jwt.sign(claims, env.JWT_ACCESS_SECRET, { issuer: env.JWT_ISSUER, audience: "other-api", expiresIn: 60 });
        expectRejected(() => verifyAccessToken(badIss), "TOKEN_INVALID");
        expectRejected(() => verifyAccessToken(badAud), "TOKEN_INVALID");
    });

    it("rejects a validly-signed token with an unknown role", () => {
        const token = jwt.sign({ sub: "u", role: "SUPERUSER" }, env.JWT_ACCESS_SECRET, { ...common, expiresIn: 60 });
        expectRejected(() => verifyAccessToken(token), "TOKEN_INVALID");
    });

    it("rejects garbage", () => {
        expectRejected(() => verifyAccessToken("not-a-jwt"), "TOKEN_INVALID");
    });
});
