import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { DatabaseError } from "../utils/DatabaseError.js";
import { logger } from "./logger.js";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

pool.on("error", (error) => {
    logger.error({ err: error }, "Unexpected error on idle database client");
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter, })

export const connectDB = async () => {
    try {
        // This physically tests the connection and credentials
        const client = await pool.connect();
        client.release(); // Release it back to the pool immediately
        console.log("Database connected successfully.");

    } catch (error: any) {
        console.error("⚠️ Warning: Server starting, but DB connection failed:", error.message);
        throw new DatabaseError(error.message,error.cause)
    }
};

export default prisma;