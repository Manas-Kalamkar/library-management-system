import prisma from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { BorrowingQuerySchemaType, UpdateBorrowingType } from "../schemas/borrowing.schema.js";

export const getBorrowings = ({ search, page, limit, sort, order }: BorrowingQuerySchemaType) => {

    const where: Prisma.BorrowingWhereInput = {
        ...(search && {
            OR: [
                { borrowerId: { contains: search, mode: 'insensitive' as const } },
                { librarianId: { contains: search, mode: 'insensitive' as const } },
                { bookId: { contains: search, mode: 'insensitive' as const } },
            ]
        })
    }

    return prisma.borrowing.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order }
    })
}


export const getBorrowingById = (id: string) => {
    return prisma.borrowing.findUnique({ where: { id } })
}

export type CreateBorrowingResult =
    | { ok: true; borrowing: Awaited<ReturnType<typeof prisma.borrowing.create>> }
    | { ok: false; reason: "BOOK_NOT_FOUND" | "BOOK_UNAVAILABLE" };

/**
 * Creates the loan and flips the book to unavailable in ONE transaction.
 * The `available: true` condition makes the claim atomic, so two librarians
 * can never lend the same copy at the same time.
 */
export const addBorrowing = (data: Prisma.BorrowingUncheckedCreateInput): Promise<CreateBorrowingResult> => {
    return prisma.$transaction(async (tx) => {
        // A loan recorded as already returned doesn't take the book off the shelf.
        if (!data.returnedAt) {
            const claimed = await tx.book.updateMany({
                where: { id: data.bookId, available: true },
                data: { available: false }
            })

            if (claimed.count === 0) {
                const exists = await tx.book.findUnique({ where: { id: data.bookId }, select: { id: true } })
                return { ok: false as const, reason: exists ? "BOOK_UNAVAILABLE" as const : "BOOK_NOT_FOUND" as const }
            }
        }

        const borrowing = await tx.borrowing.create({ data })
        return { ok: true as const, borrowing }
    })
}


/** Returning a book (setting returnedAt) makes it available again, atomically. */
export const updateBorrowing = (id: string, data: UpdateBorrowingType) => {
    return prisma.$transaction(async (tx) => {
        const before = await tx.borrowing.findUniqueOrThrow({
            where: { id },
            select: { returnedAt: true, bookId: true }
        })

        const updated = await tx.borrowing.update({
            where: { id },
            data: {
                ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
                ...(data.returnedAt !== undefined && { returnedAt: data.returnedAt }),
            },
            select: { id: true, bookId: true, returnedAt: true }
        })

        if (data.returnedAt !== undefined) {
            const wasOut = before.returnedAt === null
            const isOut = updated.returnedAt === null
            if (wasOut && !isOut) {
                await tx.book.update({ where: { id: before.bookId }, data: { available: true } })
            } else if (!wasOut && isOut) {
                // Re-opening a loan: the book must be free to be taken out again.
                const claimed = await tx.book.updateMany({
                    where: { id: before.bookId, available: true },
                    data: { available: false }
                })
                if (claimed.count === 0) throw new Error("BOOK_UNAVAILABLE")
            }
        }

        return { id: updated.id, bookId: updated.bookId }
    })
}


export const deleteBorrowing = (id: string) => {
    return prisma.$transaction(async (tx) => {
        const deleted = await tx.borrowing.delete({
            where: { id },
            select: { bookId: true, returnedAt: true, borrower: true }
        })

        // Deleting a loan that was still open frees the book.
        if (deleted.returnedAt === null) {
            await tx.book.update({ where: { id: deleted.bookId }, data: { available: true } })
        }

        return { borrower: deleted.borrower }
    })
}
