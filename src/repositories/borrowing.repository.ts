import prisma from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { RemoveUndefinedType } from "../middlewares/removeUndefined.js";
import type { BorrowingQuerySchemaType, CreateBorrowingType, UpdateBorrowingType } from "../schemas/borrowing.schema.js";

export const getBorrowings = ({ search, page, limit, sort, order }: BorrowingQuerySchemaType) => {

    const where = {
        ...(search && {
            OR: [
                {borrowerId:{contains:search,mode:'insensitive'as const}},
                {librarianId:{contains:search,mode:'insensitive'as const}},
                {bookId:{contains:search,mode:'insensitive'as const}},
            ]
        })
    }


    return prisma.borrowing.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
            [sort]: order
        }
    })
}


export const getBorrowingById = (id: string) => {
    return prisma.borrowing.findUnique({
        where: {
            id
        }
    })
}

// adding multiple borrowings in a array
// export const addBorrowing = (data: Prisma.BorrowingCreateManyInput[]) => {

//     return prisma.borrowing.createMany({
//         data
//     })
// }

export const addBorrowing = (data: Prisma.BorrowingUncheckedCreateInput) => {


    return prisma.borrowing.create({
        data
    })
}


export const updateBorrowing = (id: string, data: RemoveUndefinedType<UpdateBorrowingType>) => {
    return prisma.borrowing.update({
        where: { id },
        data,
        select: {
            id: true,
            book: true,
            bookId: true
        }
    })
}


export const deleteBorrowing = (id: string) => {
    return prisma.borrowing.delete({
        where: { id },
        select: {
            borrower: true,
            book: true
        }
    })
}

