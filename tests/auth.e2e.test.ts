import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import prisma, { disconnectDB } from "../src/config/prisma.js";
import { env } from "../src/config/env.js";
import { hashPassword } from "../src/utils/security/password.js";
import { cleanDatabase, cookiePair, PASSWORD, refreshCookie, uniqueEmail } from "./helpers.js";

const signup = (email: string, extra: object = {}) =>
    request(app).post("/api/auth/signup").send({ userName: "Test User", email, password: PASSWORD, phoneNo: "9876543210", ...extra });

const login = (email: string, password = PASSWORD) => request(app).post("/api/auth/login").send({ email, password });

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeAll(cleanDatabase);
afterAll(async () => {
    await cleanDatabase();
    await disconnectDB();
});

describe("signup", () => {
    it("creates a borrower and never returns the password hash", async () => {
        const res = await signup(uniqueEmail("signup"));
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ role: "BORROWER" });
        expect(JSON.stringify(res.body)).not.toMatch(/password|\$2[aby]\$/i);
    });

    it("ignores a client-supplied role (no privilege escalation)", async () => {
        const res = await signup(uniqueEmail("mass"), { role: "ADMIN" });
        expect(res.status).toBe(201);
        expect(res.body.role).toBe("BORROWER");
    });

    it("rejects weak passwords and bad input", async () => {
        expect((await signup(uniqueEmail("weak"), { password: "short1" })).status).toBe(400);
        expect((await signup(uniqueEmail("weak"), { password: "onlyletters" })).status).toBe(400);
        expect((await signup("not-an-email")).status).toBe(400);
        expect((await signup(uniqueEmail("phone"), { phoneNo: "123" })).status).toBe(400);
    });

    it("rejects duplicate e-mails (case-insensitively)", async () => {
        const email = uniqueEmail("dup");
        expect((await signup(email)).status).toBe(201);
        expect((await signup(email.toUpperCase())).status).toBe(409);
    });

    it("stores a bcrypt hash, not the password", async () => {
        const email = uniqueEmail("hash");
        await signup(email);
        const row = await prisma.user.findUniqueOrThrow({ where: { email } });
        expect(row.password).not.toBe(PASSWORD);
        expect(row.password).toMatch(/^\$2[aby]\$\d{2}\$/);
    });
});

describe("login", () => {
    it("returns an access token in the body and the refresh token only in an httpOnly cookie", async () => {
        const email = uniqueEmail("login");
        await signup(email);
        const res = await login(email);

        expect(res.status).toBe(200);
        expect(res.body.tokenType).toBe("Bearer");
        expect(res.body.expiresIn).toBe(env.ACCESS_TOKEN_TTL_SECONDS);
        expect(res.body.user).toMatchObject({ email, role: "BORROWER" });
        expect(res.body).not.toHaveProperty("refreshToken");
        expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/);

        const cookie = refreshCookie(res);
        expect(cookie).toMatch(/HttpOnly/i);
        expect(cookie).toMatch(/SameSite=Strict/i);
        expect(cookie).toMatch(/Path=\/api\/auth/);

        const decoded = jwt.decode(res.body.accessToken) as jwt.JwtPayload;
        expect(decoded.role).toBe("BORROWER");
    });

    it("gives the same answer for unknown e-mail and wrong password (no user enumeration)", async () => {
        const email = uniqueEmail("enum");
        await signup(email);
        const wrongPassword = await login(email, "Wr0ngPassword1");
        const unknownUser = await login(uniqueEmail("ghost"));

        expect(wrongPassword.status).toBe(401);
        expect(unknownUser.status).toBe(401);
        expect(wrongPassword.body.message).toBe(unknownUser.body.message);
        expect(wrongPassword.body.code).toBe("INVALID_CREDENTIALS");
    });

    it("locks the account after repeated failures, even for the right password", async () => {
        const email = uniqueEmail("lock");
        await signup(email);
        for (let i = 0; i < env.MAX_FAILED_LOGINS; i++) {
            expect((await login(email, "Wr0ngPassword1")).status).toBe(401);
        }
        const res = await login(email, PASSWORD);
        expect(res.status).toBe(401);

        // ...and unlocking happens by time:
        await prisma.user.update({ where: { email }, data: { lockedUntil: new Date(Date.now() - 1000) } });
        expect((await login(email, PASSWORD)).status).toBe(200);
    });
});

describe("access control", () => {
    it("rejects requests without / with malformed / with forged tokens", async () => {
        expect((await request(app).get("/api/auth/me")).status).toBe(401);
        expect((await request(app).get("/api/auth/me").set("Authorization", "Basic abc")).status).toBe(401);

        const forged = jwt.sign({ role: "ADMIN" }, "attacker-secret-attacker-secret-attacker!", {
            subject: "someone", issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE, expiresIn: 600,
        });
        const res = await request(app).get("/api/librarians").set(bearer(forged));
        expect(res.status).toBe(401);
        expect(res.headers["www-authenticate"]).toMatch(/Bearer/);
    });

    it("tells the client when the token merely expired", async () => {
        const expired = jwt.sign({ role: "BORROWER" }, env.JWT_ACCESS_SECRET, {
            subject: "x", issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE, expiresIn: -10,
        });
        const res = await request(app).get("/api/auth/me").set(bearer(expired));
        expect(res.status).toBe(401);
        expect(res.body.code).toBe("TOKEN_EXPIRED");
    });

    it("enforces roles: a borrower can read books but not staff resources", async () => {
        const email = uniqueEmail("rbac");
        await signup(email);
        const { accessToken } = (await login(email)).body;

        expect((await request(app).get("/api/auth/me").set(bearer(accessToken))).status).toBe(200);
        expect((await request(app).get("/api/books").set(bearer(accessToken))).status).toBe(200);
        expect((await request(app).get("/api/borrowers").set(bearer(accessToken))).status).toBe(403);
        expect((await request(app).get("/api/librarians").set(bearer(accessToken))).status).toBe(403);
        expect((await request(app).post("/api/books").set(bearer(accessToken)).send({})).status).toBe(403);
    });

    it("PATCH /api/borrowers/:id now requires authentication", async () => {
        const res = await request(app).patch("/api/borrowers/anything").send({ name: "Hacker" });
        expect(res.status).toBe(401);
    });

    it("lets a user delete only themselves", async () => {
        const a = uniqueEmail("del-a");
        const b = uniqueEmail("del-b");
        await signup(a);
        await signup(b);
        const ta = (await login(a)).body;
        const idB = (await login(b)).body.user.id;

        expect((await request(app).delete(`/api/auth/${idB}`).set(bearer(ta.accessToken))).status).toBe(403);
        expect((await request(app).delete(`/api/auth/${ta.user.id}`).set(bearer(ta.accessToken))).status).toBe(204);
    });
});

describe("refresh token rotation", () => {
    const setup = async (label: string) => {
        const email = uniqueEmail(label);
        await signup(email);
        const res = await login(email);
        return { email, cookie: cookiePair(refreshCookie(res)), accessToken: res.body.accessToken as string, userId: res.body.user.id as string };
    };

    it("issues a new access + refresh token and invalidates the old refresh token", async () => {
        const { cookie } = await setup("rotate");
        const res = await request(app).post("/api/auth/refresh").set("Cookie", cookie);

        expect(res.status).toBe(200);
        expect(res.body.accessToken).toBeTruthy();
        const next = cookiePair(refreshCookie(res));
        expect(next).not.toBe(cookie);

        expect((await request(app).post("/api/auth/refresh").set("Cookie", next)).status).toBe(200);
    });

    it("detects reuse of an old refresh token and revokes the whole chain", async () => {
        const { cookie: t1 } = await setup("reuse");
        const second = await request(app).post("/api/auth/refresh").set("Cookie", t1);
        const t2 = cookiePair(refreshCookie(second));

        // attacker (or buggy client) replays the already-used token
        const replay = await request(app).post("/api/auth/refresh").set("Cookie", t1);
        expect(replay.status).toBe(401);
        expect(replay.body.code).toBe("REFRESH_TOKEN_INVALID");

        // the legitimate newest token is dead too: everyone has to log in again
        expect((await request(app).post("/api/auth/refresh").set("Cookie", t2)).status).toBe(401);
    });

    it("stores only a hash of the refresh token", async () => {
        const { cookie, userId } = await setup("hashed");
        const raw = cookie.split("=")[1]!;
        const rows = await prisma.refreshToken.findMany({ where: { userId } });
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.some((r) => r.tokenHash === raw)).toBe(false);
        expect(rows[0]!.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("rejects missing, garbage and cross-origin refresh attempts", async () => {
        expect((await request(app).post("/api/auth/refresh")).status).toBe(401);
        expect((await request(app).post("/api/auth/refresh").set("Cookie", "refresh_token=garbage")).status).toBe(401);

        const { cookie } = await setup("origin");
        const evil = await request(app).post("/api/auth/refresh").set("Cookie", cookie).set("Origin", "https://evil.example");
        expect(evil.status).toBe(403);
        const ok = await request(app).post("/api/auth/refresh").set("Cookie", cookie).set("Origin", "http://localhost:5173");
        expect(ok.status).toBe(200);
    });

    it("picks up role changes on refresh", async () => {
        const { cookie, userId } = await setup("rolechange");
        await prisma.user.update({ where: { id: userId }, data: { role: "LIBRARIAN" } });
        const res = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
        expect(res.body.user.role).toBe("LIBRARIAN");
        expect((jwt.decode(res.body.accessToken) as jwt.JwtPayload).role).toBe("LIBRARIAN");
    });

    it("logout revokes the refresh token and clears the cookie", async () => {
        const { cookie } = await setup("logout");
        const out = await request(app).post("/api/auth/logout").set("Cookie", cookie);
        expect(out.status).toBe(200);
        expect(refreshCookie(out)).toMatch(/refresh_token=;/);

        expect((await request(app).post("/api/auth/refresh").set("Cookie", cookie)).status).toBe(401);
        // idempotent
        expect((await request(app).post("/api/auth/logout")).status).toBe(200);
    });

    it("logout-all revokes every device", async () => {
        const email = uniqueEmail("logoutall");
        await signup(email);
        const d1 = await login(email);
        const d2 = await login(email);

        await request(app).post("/api/auth/logout-all").set(bearer(d1.body.accessToken));

        expect((await request(app).post("/api/auth/refresh").set("Cookie", cookiePair(refreshCookie(d1)))).status).toBe(401);
        expect((await request(app).post("/api/auth/refresh").set("Cookie", cookiePair(refreshCookie(d2)))).status).toBe(401);
    });

    it("change-password logs out other devices but keeps this one signed in", async () => {
        const email = uniqueEmail("chpw");
        await signup(email);
        const other = await login(email);
        const current = await login(email);
        const NEW_PASSWORD = "An0therStrongPass";

        const wrong = await request(app).post("/api/auth/change-password").set(bearer(current.body.accessToken))
            .send({ currentPassword: "Wr0ngPassword1", newPassword: NEW_PASSWORD });
        expect(wrong.status).toBe(403);

        const res = await request(app).post("/api/auth/change-password").set(bearer(current.body.accessToken))
            .send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
        expect(res.status).toBe(200);
        expect(res.body.accessToken).toBeTruthy();

        expect((await request(app).post("/api/auth/refresh").set("Cookie", cookiePair(refreshCookie(other)))).status).toBe(401);
        expect((await request(app).post("/api/auth/refresh").set("Cookie", cookiePair(refreshCookie(res)))).status).toBe(200);
        expect((await login(email, PASSWORD)).status).toBe(401);
        expect((await login(email, NEW_PASSWORD)).status).toBe(200);
    });
});

describe("library workflow (RBAC + data integrity)", () => {
    const adminEmail = uniqueEmail("admin");
    let adminToken = "";
    let librarianToken = "";
    let borrowerUserId = "";
    let bookId = "";
    let librarianProfileId = "";

    beforeAll(async () => {
        await prisma.user.create({
            data: { userName: "Admin", email: adminEmail, password: await hashPassword(PASSWORD), role: "ADMIN" },
        });
        adminToken = (await login(adminEmail)).body.accessToken;
    });

    it("admin creates a librarian; the response leaks no hash; the librarian can log in", async () => {
        const email = uniqueEmail("librarian");
        const res = await request(app).post("/api/librarians").set(bearer(adminToken))
            .send({ name: "Lib Rarian", email, password: PASSWORD, salary: 1000, joiningYear: 2024 });
        expect(res.status).toBe(201);
        expect(JSON.stringify(res.body)).not.toMatch(/password|\$2[aby]\$/i);

        const loginRes = await login(email);
        librarianToken = loginRes.body.accessToken;
        const profile = await prisma.librarian.findUniqueOrThrow({ where: { userId: loginRes.body.user.id } });
        librarianProfileId = profile.id;

        const list = await request(app).get("/api/librarians").set(bearer(adminToken));
        expect(list.status).toBe(200);
        expect(JSON.stringify(list.body)).not.toMatch(/password|\$2[aby]\$/i);
        // librarians cannot manage librarians
        expect((await request(app).get("/api/librarians").set(bearer(librarianToken))).status).toBe(403);
    });

    it("librarian creates a borrower with a HASHED password (was stored in plaintext before)", async () => {
        const email = uniqueEmail("borrower");
        const res = await request(app).post("/api/borrowers").set(bearer(librarianToken))
            .send({ name: "Bo Rrower", email, password: PASSWORD, phoneNo: "9123456780" });
        expect(res.status).toBe(201);

        const row = await prisma.user.findUniqueOrThrow({ where: { email } });
        expect(row.password).not.toBe(PASSWORD);
        expect(row.password).toMatch(/^\$2[aby]\$/);
        borrowerUserId = row.id;
        expect((await login(email)).status).toBe(200);

        const list = await request(app).get("/api/borrowers?search=Bo").set(bearer(librarianToken));
        expect(list.status).toBe(200);
        expect(JSON.stringify(list.body)).not.toMatch(/password|\$2[aby]\$/i);
        const one = await request(app).get(`/api/borrowers/${borrowerUserId}`).set(bearer(librarianToken));
        expect(one.status).toBe(200);
        expect(JSON.stringify(one.body)).not.toMatch(/password|\$2[aby]\$/i);
    });

    it("librarian adds author + book", async () => {
        const author = await request(app).post("/api/authors").set(bearer(librarianToken)).send({ name: "TEST Author", birthYear: 1970 });
        expect(author.status).toBe(201);
        const authorId = author.body.author.id;

        const book = await request(app).post("/api/books").set(bearer(librarianToken))
            .send({ title: "TEST Book", genre: "Fiction", publishedYear: 2000, available: true, authorId });
        expect(book.status).toBe(201);
        bookId = (await prisma.book.findFirstOrThrow({ where: { title: "TEST Book" } })).id;

        // unknown author is a clean 409, not a hung request / 500
        const bad = await request(app).post("/api/books").set(bearer(librarianToken))
            .send({ title: "TEST Orphan", genre: "x", publishedYear: 2000, available: true, authorId: "nope" });
        expect(bad.status).toBe(409);
    });

    it("lending: due date defaults to +7 days, book becomes unavailable, double-lending is blocked", async () => {
        const borrower = await prisma.borrower.findUniqueOrThrow({ where: { userId: borrowerUserId } });
        const res = await request(app).post("/api/borrowings").set(bearer(librarianToken))
            .send({ bookId, borrowerId: borrower.id });
        expect(res.status).toBe(201);
        expect(res.body.librarianId).toBe(librarianProfileId); // taken from the token, not the body

        const days = (new Date(res.body.dueDate).getTime() - new Date(res.body.borrowedAt).getTime()) / 86_400_000;
        expect(days).toBeCloseTo(7, 3);
        expect((await prisma.book.findUniqueOrThrow({ where: { id: bookId } })).available).toBe(false);

        const again = await request(app).post("/api/borrowings").set(bearer(librarianToken))
            .send({ bookId, borrowerId: borrower.id });
        expect(again.status).toBe(409);

        // PATCH no longer resets borrowedAt, and returning the book frees it
        const patched = await request(app).patch(`/api/borrowings/${res.body.id}`).set(bearer(librarianToken))
            .send({ returnedAt: new Date().toISOString() });
        expect(patched.status).toBe(200);
        const after = await prisma.borrowing.findUniqueOrThrow({ where: { id: res.body.id } });
        expect(after.borrowedAt.toISOString()).toBe(res.body.borrowedAt);
        expect((await prisma.book.findUniqueOrThrow({ where: { id: bookId } })).available).toBe(true);
    });

    it("a librarian can't impersonate another librarian, and admins must name one", async () => {
        const borrower = await prisma.borrower.findUniqueOrThrow({ where: { userId: borrowerUserId } });
        const noLibrarian = await request(app).post("/api/borrowings").set(bearer(adminToken))
            .send({ bookId, borrowerId: borrower.id });
        expect(noLibrarian.status).toBe(400);

        const viaAdmin = await request(app).post("/api/borrowings").set(bearer(adminToken))
            .send({ bookId, borrowerId: borrower.id, librarianId: librarianProfileId });
        expect(viaAdmin.status).toBe(201);
    });

    it("deleting a borrower with loans is a clean 409", async () => {
        const res = await request(app).delete(`/api/borrowers/${borrowerUserId}`).set(bearer(librarianToken));
        expect(res.status).toBe(409);
    });
});

describe("error handling & hardening", () => {
    it("returns JSON 404 for unknown routes and 400 for malformed JSON without leaking internals", async () => {
        const notFound = await request(app).get("/api/nope");
        expect(notFound.status).toBe(404);
        expect(notFound.body.message).toBe("Route Not Found");

        const malformed = await request(app).post("/api/auth/login").set("Content-Type", "application/json").send("{ bad json");
        expect(malformed.status).toBe(400);
        expect(JSON.stringify(malformed.body)).not.toMatch(/SyntaxError|node_modules|at /);
    });

    it("rejects oversized bodies", async () => {
        const res = await request(app).post("/api/auth/login").send({ email: "a@b.co", password: "x".repeat(20_000) });
        expect(res.status).toBe(413);
    });

    it("sets security headers and hides the framework", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.headers["x-powered-by"]).toBeUndefined();
        expect(res.headers["x-content-type-options"]).toBe("nosniff");
        expect(res.headers["strict-transport-security"]).toBeTruthy();
        expect(res.headers["x-request-id"]).toBeTruthy();
    });

    it("readiness checks the database", async () => {
        expect((await request(app).get("/ready")).status).toBe(200);
    });

    it("only reflects allow-listed CORS origins", async () => {
        const good = await request(app).get("/health").set("Origin", "http://localhost:5173");
        expect(good.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
        expect(good.headers["access-control-allow-credentials"]).toBe("true");

        const evil = await request(app).get("/health").set("Origin", "https://evil.example");
        expect(evil.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("auth responses are never cached", async () => {
        const res = await request(app).post("/api/auth/logout");
        expect(res.headers["cache-control"]).toBe("no-store");
    });
});
