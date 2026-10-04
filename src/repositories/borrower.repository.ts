import prisma from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { BorrowerQuerySchemaType } from "../schemas/borrower.schema.js";

// Never select the password hash (or lockout fields) for anything that is returned to a client.
const safeUser = { select: { id: true, email: true, userName: true } } as const;

export const getBorrowers = ({ search, joiningDate, page, limit, sort, order }: BorrowerQuerySchemaType) => {

    const where: Prisma.BorrowerWhereInput = {
        ...(search && {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { phoneNo: { contains: search } },
                { user: { email: { contains: search, mode: 'insensitive' as const } } },
            ]
        }),
        ...(joiningDate !== undefined && { joiningDate })
    }

    return prisma.borrower.findMany({
        where,
        include: { user: safeUser },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order }
    })
}

/** `id` is the *user* id, as it always was in this API. */
export const getBorrowerById = (id: string) => {
    return prisma.borrower.findUnique({
        where: { userId: id },
        include: { user: safeUser }
    })
}

export const addBorrower = (data: Prisma.UserCreateInput) => {
    return prisma.user.create({
        data,
        select: { id: true, email: true, userName: true, role: true }
    })
}


export const deleteBorrower = (id: string) => {
    return prisma.user.delete({
        // `role` in the filter stops this endpoint from touching librarians/admins.
        where: { id, role: "BORROWER" },
        select: { userName: true }
    })
}

export const updateBorrower = (id: string, data: Prisma.UserUpdateInput) => {
    return prisma.user.update({
        where: { id, role: "BORROWER" },
        data,
        select: { userName: true }
    })
}
