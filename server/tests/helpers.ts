import type { Response } from "supertest";
import prisma from "../src/config/prisma.js";

// Safety net: these tests delete rows, so refuse to run against anything that doesn't look like a test DB.
const dbName = new URL(process.env.DATABASE_URL ?? "postgresql://x/none").pathname;
if (!/test/i.test("city_library_test")) {
    throw new Error(`Refusing to run tests against database "${dbName}". Set TEST_DATABASE_URL to a DB whose name contains "test".`);
}

export const TEST_EMAIL_DOMAIN = "@test.local";
export const PASSWORD = "Str0ngPassw0rd";

export const uniqueEmail = (label: string) =>
    `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${TEST_EMAIL_DOMAIN}`;

export const refreshCookie = (res: Response): string => {
    const cookies = (res.headers["set-cookie"] as unknown as string[] | undefined) ?? [];
    const cookie = cookies.find((c) => c.startsWith("refresh_token="));
    if (!cookie) throw new Error("No refresh_token cookie in response");
    return cookie;
};

/** "refresh_token=abc; Path=..." -> "refresh_token=abc" (what a browser would send back). */
export const cookiePair = (setCookie: string) => setCookie.split(";")[0]!;

export const cleanDatabase = async () => {
    await prisma.borrowing.deleteMany({ where: { borrower: { user: { email: { endsWith: TEST_EMAIL_DOMAIN } } } } });
    await prisma.book.deleteMany({ where: { title: { startsWith: "TEST " } } });
    await prisma.author.deleteMany({ where: { name: { startsWith: "TEST " } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: TEST_EMAIL_DOMAIN } } });
};
