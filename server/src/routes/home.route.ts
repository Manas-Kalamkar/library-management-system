import { Router, type Request, type Response } from "express";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

const homeRouter = Router();

homeRouter.get('/home', (_req: Request, res: Response) => {
    res.status(200).send(`
        <h1>
            Welcome To City Library
        </h1>
        <p>API root: <code>/api</code> &mdash; see the README for the authentication flow.</p>
        `)
})

/** Liveness: the process is up. */
homeRouter.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" })
})

/** Readiness: the process can actually serve traffic (database reachable). */
homeRouter.get('/ready', async (_req: Request, res: Response) => {
    try {
        await prisma.$queryRaw`SELECT 1`
    } catch {
        throw new AppError("Database not ready", 503)
    }
    res.status(200).json({ status: "ready" })
})

export default homeRouter;
