import { Pool } from "pg";
import { env } from "./env.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { DatabaseError } from "../utils/DatabaseError.js";
import { logger } from "./logger.js";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
})

pool.on("error", (error) => {
    logger.error({ err: error }, "Unexpected error on idle database client");
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter, })

export const connectDB = async () => {
    try {
        const client = await pool.connect();
        client.release(); 
        console.log("Database connected successfully.");

    } catch (error: any) {
        const err = error as Error;
        throw new DatabaseError("Database connection failed", err.message)
    }
};

export const disconnectDB = async () => {
    await prisma.$disconnect();
    await pool.end();
}

export default prisma;