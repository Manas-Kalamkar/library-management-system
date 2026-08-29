import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { DatabaseError } from "../utils/DatabaseError.js";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

pool.on("error", (error) => {
    throw new DatabaseError(error.message, error.cause)
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter, })

// Clean abstraction for server startup
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