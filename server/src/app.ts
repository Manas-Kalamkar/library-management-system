import { randomUUID } from "node:crypto";
import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import homeRouter from "./routes/home.route.js";
import userRouter from "./routes/user.route.js";
import booksRouter from "./routes/book.route.js";
import authorsRouter from "./routes/author.route.js";
import librarianRouter from "./routes/librarian.route.js";
import borrowerRouter from "./routes/borrower.route.js";
import borrowingRouter from "./routes/borrowing.route.js";

import { AppError } from "./utils/AppError.js";

const app: Express = express();

// Behind a load balancer / reverse proxy, set TRUST_PROXY so req.ip (used by the
// rate limiters and audit data) is the real client and not the proxy.
app.set("trust proxy", env.TRUST_PROXY);
app.disable("x-powered-by");

// ---- Request id + structured access log ------------------------------------
const SAFE_REQUEST_ID = /^[\w-]{8,64}$/;
app.use(
    pinoHttp({
        logger,
        genReqId: (req, res) => {
            const incoming = req.headers["x-request-id"];
            const id = typeof incoming === "string" && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
            res.setHeader("X-Request-Id", id);
            return id;
        },
        autoLogging: { ignore: (req) => req.url === "/health" },
        customLogLevel: (_req, res, err) => {
            if (err || res.statusCode >= 500) return "error";
            if (res.statusCode >= 400) return "warn";
            return "info";
        },
    }),
);

// ---- Security headers & CORS ----------------------------------------------
app.use(helmet());
app.use(
    cors({
        // Exact-match allow-list. Requests with no Origin (curl, mobile apps, server-to-server) pass.
        origin: (origin, callback) => callback(null, !origin || env.CORS_ORIGINS.includes(origin)),
        credentials: true, // lets the browser send the refresh cookie
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["X-Request-Id", "Retry-After"],
        maxAge: 600,
    }),
);

// Health endpoints sit before the rate limiter so probes never get throttled.
app.use(homeRouter);

app.use(globalLimiter);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.use('/api/auth', userRouter)
app.use('/api/books', booksRouter)
app.use('/api/authors', authorsRouter)
app.use('/api/librarians', librarianRouter)
app.use('/api/borrowers', borrowerRouter)
app.use('/api/borrowings', borrowingRouter)

app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError("Route Not Found", 404))
})

app.use(errorHandler);

export default app;
