import { beforeEach, describe, expect, it, vi } from "vitest";

type Api = typeof import("../src/lib/api");

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

const session = (token: string) => ({
    user: { id: "u1", email: "a@b.co", userName: "Ada", role: "LIBRARIAN" },
    accessToken: token,
    tokenType: "Bearer",
    expiresIn: 900,
});

let api: Api;
let fetchMock: ReturnType<typeof vi.fn>;

const calls = (path: string) => fetchMock.mock.calls.filter(([url]) => String(url).includes(path)).length;

beforeEach(async () => {
    vi.resetModules(); // fresh in-memory token + refresh state per test
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(navigator, "locks", { value: undefined, configurable: true });
    api = await import("../src/lib/api");
});

describe("request", () => {
    it("sends the access token as a Bearer header and includes cookies", async () => {
        api.setAccessToken("tok-1");
        fetchMock.mockResolvedValueOnce(json([{ id: "b1" }]));

        await api.request("/books", { query: { search: "dune", page: 2, empty: "", nothing: undefined } });

        const [url, init] = fetchMock.mock.calls[0]!;
        expect(url).toBe("/api/books?search=dune&page=2");
        expect(init.headers.Authorization).toBe("Bearer tok-1");
        expect(init.credentials).toBe("include");
    });

    it("does not attach a token when auth is false", async () => {
        api.setAccessToken("tok-1");
        fetchMock.mockResolvedValueOnce(json({ ok: true }));
        await api.request("/auth/login", { method: "POST", body: { a: 1 }, auth: false });
        expect(fetchMock.mock.calls[0]![1].headers.Authorization).toBeUndefined();
    });

    it("returns plain-text bodies (the API answers 'Book added' as text)", async () => {
        fetchMock.mockResolvedValueOnce(new Response("Book added", { status: 201, headers: { "content-type": "text/html" } }));
        await expect(api.request("/books", { method: "POST", body: {} })).resolves.toBe("Book added");
    });

    it("turns error responses into ApiError with code, details and retry-after", async () => {
        fetchMock.mockResolvedValueOnce(
            json({ status: 429, message: "Too many attempts", code: "RATE_LIMITED", requestId: "r-1" }, 429, { "retry-after": "60" }),
        );
        const error = await api.request("/auth/login", { method: "POST", auth: false }).catch((e) => e);
        expect(error).toBeInstanceOf(api.ApiError);
        expect(error).toMatchObject({ status: 429, code: "RATE_LIMITED", requestId: "r-1", retryAfter: 60, message: "Too many attempts" });
    });

    it("reports network failures with status 0", async () => {
        fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
        const error = (await api.request("/books").catch((e) => e)) as InstanceType<Api["ApiError"]>;
        expect(error).toMatchObject({ status: 0, code: "NETWORK" });
        expect(error.isNetwork).toBe(true);
    });
});

describe("token refresh", () => {
    it("refreshes once on 401 and retries the original request with the new token", async () => {
        api.setAccessToken("old");
        fetchMock
            .mockResolvedValueOnce(json({ code: "TOKEN_EXPIRED", message: "Access token expired" }, 401))
            .mockResolvedValueOnce(json(session("new")))
            .mockResolvedValueOnce(json([{ id: "b1" }]));

        await expect(api.request("/books")).resolves.toEqual([{ id: "b1" }]);

        expect(calls("/auth/refresh")).toBe(1);
        expect(fetchMock.mock.calls[2]![1].headers.Authorization).toBe("Bearer new");
        expect(api.getAccessToken()).toBe("new");
    });

    it("shares ONE refresh between requests that fail together (the backend rotates tokens)", async () => {
        api.setAccessToken("old");
        let refreshed = false;
        fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
            if (url.includes("/auth/refresh")) {
                await new Promise((r) => setTimeout(r, 20));
                refreshed = true;
                return json(session("new"));
            }
            const bearer = (init.headers as Record<string, string>).Authorization;
            return bearer === "Bearer new" && refreshed ? json({ ok: url }) : json({ code: "TOKEN_EXPIRED", message: "expired" }, 401);
        });

        const results = await Promise.all([api.request("/books"), api.request("/authors"), api.request("/borrowings")]);

        expect(results).toHaveLength(3);
        expect(calls("/auth/refresh")).toBe(1);
    });

    it("signs the user out when the refresh is rejected", async () => {
        const expired = vi.fn();
        api.onSessionExpired(expired);
        api.setAccessToken("old");
        fetchMock
            .mockResolvedValueOnce(json({ code: "TOKEN_EXPIRED", message: "Access token expired" }, 401))
            .mockResolvedValueOnce(json({ code: "REFRESH_TOKEN_INVALID", message: "Invalid or expired refresh token" }, 401));

        const error = await api.request("/books").catch((e) => e);

        expect(error).toMatchObject({ status: 401 });
        expect(expired).toHaveBeenCalledOnce();
        expect(api.getAccessToken()).toBeNull();
    });

    it("does not log the user out when the server is merely rate limiting or down", async () => {
        const expired = vi.fn();
        api.onSessionExpired(expired);
        fetchMock
            .mockResolvedValueOnce(json({ code: "TOKEN_EXPIRED", message: "expired" }, 401))
            .mockResolvedValueOnce(json({ message: "Too many refresh attempts" }, 429));

        await api.request("/books").catch(() => undefined);
        expect(expired).not.toHaveBeenCalled();
    });

    it("never retries more than once", async () => {
        fetchMock
            .mockResolvedValueOnce(json({ message: "nope" }, 401))
            .mockResolvedValueOnce(json(session("new")))
            .mockResolvedValueOnce(json({ message: "still nope" }, 401));
        await expect(api.request("/books")).rejects.toMatchObject({ status: 401 });
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("refreshSession resolves null (not an error) when there is no cookie", async () => {
        fetchMock.mockResolvedValueOnce(json({ code: "REFRESH_TOKEN_MISSING", message: "missing" }, 401));
        await expect(api.refreshSession()).resolves.toBeNull();
    });
});

describe("fieldErrors", () => {
    it("maps validation issues to the first message per field", () => {
        const error = new api.ApiError("Invalid Input", 400, undefined, [
            { path: ["email"], message: "Invalid email address" },
            { path: ["email"], message: "second" },
            { path: ["password"], message: "Password must be at least 8 characters" },
        ]);
        expect(api.fieldErrors(error)).toEqual({
            email: "Invalid email address",
            password: "Password must be at least 8 characters",
        });
        expect(api.fieldErrors(new Error("x"))).toEqual({});
    });
});
