import type { AuthSession } from "./types";

/**
 * Tiny fetch wrapper that implements the backend's auth contract:
 *  - the short-lived ACCESS token lives only in memory (never localStorage -> XSS can't read it at rest)
 *  - the REFRESH token is an httpOnly cookie the browser handles; we only ever call /auth/refresh
 *  - a 401 triggers exactly ONE refresh (shared by every request that failed at the same time),
 *    then the original request is retried once
 *  - refreshes are serialised across tabs with the Web Locks API, because the backend rotates
 *    the refresh token on every use and two tabs racing would invalidate each other
 */

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public code?: string,
        public details?: unknown,
        public requestId?: string,
        public retryAfter?: number,
    ) {
        super(message);
        this.name = "ApiError";
    }

    get isNetwork() {
        return this.status === 0;
    }
}

const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "/api").replace(/\/$/, "");

let accessToken: string | null = null;
let sessionExpiredHandler: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
};
export const getAccessToken = () => accessToken;
export const onSessionExpired = (handler: (() => void) | null) => {
    sessionExpiredHandler = handler;
};

export type Query = Record<string, string | number | boolean | null | undefined>;

export const buildUrl = (path: string, query?: Query) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
        if (value === undefined || value === null || value === "") continue;
        params.set(key, String(value));
    }
    const qs = params.toString();
    return `${BASE}${path}${qs ? `?${qs}` : ""}`;
};

const parseBody = async (res: Response): Promise<unknown> => {
    if (res.status === 204) return undefined;
    const type = res.headers.get("content-type") ?? "";
    if (type.includes("application/json")) return res.json().catch(() => undefined);
    // A few endpoints answer with plain text ("Book added").
    const text = await res.text().catch(() => "");
    return text || undefined;
};

const toApiError = (res: Response, body: unknown) => {
    const data = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const retryAfter = Number(res.headers.get("retry-after")) || undefined;
    const message =
        typeof data.message === "string"
            ? data.message
            : res.status === 429
              ? "Too many requests. Please wait a moment and try again."
              : `Request failed (${res.status})`;
    return new ApiError(
        message,
        res.status,
        typeof data.code === "string" ? data.code : undefined,
        data.details,
        typeof data.requestId === "string" ? data.requestId : undefined,
        retryAfter,
    );
};

const networkError = () => new ApiError("Can't reach the server. Check your connection and try again.", 0, "NETWORK");

// ---- refresh (single flight, cross-tab safe) --------------------------------------------------

let inFlightRefresh: Promise<AuthSession | null> | null = null;

const withCrossTabLock = <T>(task: () => Promise<T>): Promise<T> =>
    typeof navigator !== "undefined" && navigator.locks
        ? navigator.locks.request("city-library-refresh", task)
        : task();

const performRefresh = async (): Promise<AuthSession | null> => {
    let res: Response;
    try {
        res = await fetch(`${BASE}/auth/refresh`, { method: "POST", credentials: "include" });
    } catch {
        throw networkError();
    }
    if (res.status === 401 || res.status === 403) {
        accessToken = null;
        return null; // no valid session: the user has to sign in
    }
    const body = await parseBody(res);
    if (!res.ok) throw toApiError(res, body); // 429 / 5xx: say so, don't pretend the user is signed out
    const session = body as AuthSession;
    accessToken = session.accessToken;
    return session;
};

/** Restores / renews the session using the refresh cookie. Resolves null when there is none. */
export const refreshSession = (): Promise<AuthSession | null> => {
    inFlightRefresh ??= withCrossTabLock(performRefresh).finally(() => {
        inFlightRefresh = null;
    });
    return inFlightRefresh;
};

// ---- requests --------------------------------------------------------------------------------

export interface RequestOptions {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    query?: Query;
    signal?: AbortSignal;
    /** false for login/signup, which must not trigger a refresh on 401. */
    auth?: boolean;
}

const send = async (path: string, { method = "GET", body, query, signal, auth = true }: RequestOptions) => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
    try {
        return await fetch(buildUrl(path, query), {
            method,
            headers,
            credentials: "include",
            signal: signal ?? null,
            body: body === undefined ? null : JSON.stringify(body),
        });
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
        throw networkError();
    }
};

export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const auth = options.auth ?? true;
    let res = await send(path, options);

    if (res.status === 401 && auth) {
        // Resolves null only when the refresh cookie is genuinely rejected. Rate limits, outages
        // and network errors throw instead, so a hiccup never signs the user out.
        const session = await refreshSession();
        if (session) {
            res = await send(path, options);
        } else {
            sessionExpiredHandler?.();
        }
    }

    const body = await parseBody(res);
    if (!res.ok) throw toApiError(res, body);
    return body as T;
}

/** Maps backend validation issues ({ path, message }[]) to { field: message } for forms. */
export const fieldErrors = (error: unknown): Record<string, string> => {
    if (!(error instanceof ApiError) || !Array.isArray(error.details)) return {};
    const out: Record<string, string> = {};
    for (const issue of error.details as { path?: unknown[]; message?: string }[]) {
        const key = issue.path?.[0];
        if (typeof key === "string" && issue.message && !(key in out)) out[key] = issue.message;
    }
    return out;
};

export const errorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Something went wrong. Please try again.";
