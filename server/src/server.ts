import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { connectDB, disconnectDB } from "./config/prisma.js";
import { purgeExpiredTokens } from "./services/token.service.js";

const SIX_HOURS = 6 * 60 * 60 * 1000;

const startServer = async () => {
    await connectDB();

    const server = app.listen(env.PORT, () => {
        logger.info(`Server is running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    });

    // Slightly above typical load-balancer idle timeouts (avoids sporadic 502s) + slowloris protection.
    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000;
    server.requestTimeout = 30_000;

    // Housekeeping for the refresh-token table.
    const purge = () => purgeExpiredTokens().catch((err) => logger.error({ err }, "Token purge failed"));
    void purge();
    const purgeTimer = setInterval(purge, SIX_HOURS);
    purgeTimer.unref();

    let shuttingDown = false;
    const shutdown = (reason: string, exitCode = 0) => {
        if (shuttingDown) return;
        shuttingDown = true;
        logger.info(`Shutting down (${reason})`);

        // Hard stop if connections refuse to drain.
        setTimeout(() => process.exit(1), 10_000).unref();

        server.close(async () => {
            clearInterval(purgeTimer);
            await disconnectDB().catch((err) => logger.error({ err }, "Error closing database"));
            process.exit(exitCode);
        });
        server.closeIdleConnections();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("uncaughtException", (err) => {
        logger.fatal({ err }, "Uncaught exception");
        shutdown("uncaughtException", 1);
    });
    process.on("unhandledRejection", (reason) => {
        logger.fatal({ err: reason }, "Unhandled promise rejection");
        shutdown("unhandledRejection", 1);
    });
};

startServer().catch((err) => {
    logger.fatal({ err }, "Failed to start server");
    process.exit(1);
});
