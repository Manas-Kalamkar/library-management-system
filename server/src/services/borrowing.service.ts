import type { Prisma } from "../generated/prisma/client.js";
import { addBorrowing, deleteBorrowing, getBorrowingById, getBorrowings, updateBorrowing } from "../repositories/borrowing.repository.js"
import { findLibrarianByUserId } from "../repositories/librarian.repository.js";
import type { BorrowingQuerySchemaType, CreateBorrowingType, UpdateBorrowingType } from "../schemas/borrowing.schema.js";
import { AppError } from "../utils/AppError.js";
import { handlePrismaError } from "../utils/prismaErrors.js";
import type { AuthUser } from "../utils/security/jwt.js";

const LOAN_PERIOD_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;


export const getBorrowingsService = async (query: BorrowingQuerySchemaType) => {
    return await getBorrowings(query);
}


export const getBorrowingByIdService = async (id: string) => {
    const borrowing = await getBorrowingById(id);
    if (!borrowing) throw new AppError("Borrowing Not Found", 404)
    return borrowing;
}


export const addBorrowingsService = async (data: CreateBorrowingType, actor: AuthUser) => {

    // A librarian is always recorded as themselves (can't attribute a loan to a colleague).
    // An admin has no librarian profile, so must name one explicitly.
    let librarianId = data.librarianId;
    if (actor.role === "LIBRARIAN") {
        const librarian = await findLibrarianByUserId(actor.id);
        if (!librarian) throw new AppError("Librarian profile not found for this account", 403)
        librarianId = librarian.id;
    }
    if (!librarianId) throw new AppError("librarianId is required", 400)

    const dueDate = data.dueDate ?? new Date(data.borrowedAt.getTime() + LOAN_PERIOD_DAYS * DAY_MS)
    if (dueDate <= data.borrowedAt) throw new AppError("dueDate must be after borrowedAt", 400)

    const newData: Prisma.BorrowingUncheckedCreateInput = {
        bookId: data.bookId,
        librarianId,
        borrowerId: data.borrowerId,
        borrowedAt: data.borrowedAt,
        dueDate,
        returnedAt: data.returnedAt ?? null
    }

    try {
        const result = await addBorrowing(newData);

        if (!result.ok) {
            if (result.reason === "BOOK_NOT_FOUND") throw new AppError("Book not found", 404)
            throw new AppError("Book is not available", 409)
        }
        return result.borrowing
    } catch (error) {
        if (error instanceof AppError) throw error;
        return handlePrismaError(error, {
            P2003: "Borrower or librarian does not exist",
        })
    }
};


export const updateBorrowingService = async (id: string, data: UpdateBorrowingType) => {
    try {
        return await updateBorrowing(id, data);
    } catch (error) {
        if (error instanceof Error && error.message === "BOOK_UNAVAILABLE") {
            throw new AppError("Book is already out on another loan", 409)
        }
        return handlePrismaError(error, {
            P2025: "Borrowing not found",
        })
    }
}


export const deleteBorrowingsService = async (id: string) => {
    try {
        return await deleteBorrowing(id);
    } catch (error) {
        return handlePrismaError(error, {
            P2025: "Borrowing not found",
        })
    }
}
