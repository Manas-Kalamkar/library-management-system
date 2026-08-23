import prisma from "../config/prisma.js";
import type { RemoveUndefinedType } from "../middlewares/removeUndefined.js";
import type { CreateLibrarianType, LibrarianQuerySchemaType, UpdateLibrarianType } from "../schemas/librarian.schema.js";

export const getLibrarians = ({ search, joiningYear, sort, order, page, limit }: LibrarianQuerySchemaType) => {
    const where = {
        ...(search && {
            OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } },]
        }),
        ...(joiningYear !== undefined && { joiningYear })

    }
    return prisma.librarian.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
            [sort]: order
        }
    })
}
export const getLibrarianById = (id: string) => {
    return prisma.librarian.findUnique({
        where: {
            id
        }
    })
}
export const addLibrarian = (data: CreateLibrarianType) => {
    return prisma.librarian.create({
        data
    })
}


export const deleteLibrarian = (id: string) => {
    return prisma.librarian.delete({
        where: { id },
        select: {
            name: true,
        }
    })
}

export const updateLibrarian = (id: string, data: RemoveUndefinedType<UpdateLibrarianType>) => {
    return prisma.librarian.update({
        where: {
            id
        }
        ,
        data,
        select: {
            name: true,
        }

    })
}