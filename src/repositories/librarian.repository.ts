import prisma from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { LibrarianQuerySchemaType } from "../schemas/librarian.schema.js";

const safeUser = { select: { id: true, email: true, userName: true } } as const;

export const getLibrarians = ({ search, joiningYear, sort, order, page, limit }: LibrarianQuerySchemaType) => {
    const where: Prisma.LibrarianWhereInput = {
        ...(search && {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { user: { email: { contains: search, mode: 'insensitive' as const } } },
            ]
        }),
        ...(joiningYear !== undefined && { joiningYear })
    }
    return prisma.librarian.findMany({
        where,
        include: { user: safeUser },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order }
    })
}

/** `id` is the *user* id, as it always was in this API. */
export const getLibrarianById = (id: string) => {
    return prisma.librarian.findUnique({
        where: { userId: id },
        include: { user: safeUser }
    })
}

export const findLibrarianByUserId = (userId: string) => {
    return prisma.librarian.findUnique({ where: { userId }, select: { id: true } })
}

export const addLibrarian = (data: Prisma.UserCreateInput) => {
    return prisma.user.create({
        data,
        select: {
            userName: true,
            email: true
        }
    })
}


export const deleteLibrarian = (id: string) => {
    return prisma.user.delete({
        where: { id, role: "LIBRARIAN" },
        select: { userName: true }
    })
}

export const updateLibrarian = (id: string, data: Prisma.UserUpdateInput) => {
    return prisma.user.update({
        where: { id, role: "LIBRARIAN" },
        data,
        select: {
            id: true,
            userName: true,
            email: true,
            librarians: { select: { name: true, salary: true, joiningYear: true } }
        }
    })
}
