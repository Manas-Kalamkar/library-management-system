import type { AuthUser } from "../utils/security/jwt.js";

declare global {
    namespace Express {
        interface Request {
            /** Set by requireAuth after the access token has been verified. */
            user?: AuthUser;
        }
    }
}

export {};
