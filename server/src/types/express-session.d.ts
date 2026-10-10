import type { AuthUser } from "../utils/security/jwt.ts";

declare global {
    namespace Express {
        interface Request {
            /** Set by requireAuth after the access token has been verified. */
            user?: AuthUser;
        }
    }
}

export {};
