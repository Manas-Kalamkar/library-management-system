import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "./AppError.js";

type Messages = Partial<Record<"P2002" | "P2003" | "P2025", string>>;

export const handlePrismaError = (error: unknown, messages: Messages): never => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const message = messages[error.code as keyof Messages];
        if (message) {
            const status = error.code === "P2025" ? 404 : 409;
            throw new AppError(message, status);
        }
    }
    throw error;
};
