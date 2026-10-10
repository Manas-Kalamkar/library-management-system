import prisma from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { BookQuerySchemaType} from "../schemas/book.schema.js";



export const addBook = async (data: Prisma.BookCreateInput) => {
    return await prisma.book.create({
        data
    })
}

export const getBooks = async ({ search, genre, publishedYear, available, page, limit, sort, order }: BookQuerySchemaType) => {

    const where = {
        ...(search && {
            OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { genre: { contains: search, mode: 'insensitive' as const } }]
        }),
        ...(genre && {
            genre: { contains: genre, mode: 'insensitive' as const }
        }),
        ...(publishedYear !== undefined && { publishedYear, }),
        ...(available !== undefined && { available, }),
    }
    return await prisma.book.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
            [sort]: order
        }
    })
}
export const getBooksById = async (id: string) => {
    return await prisma.book.findUnique({
        where: { id }
    })
}
export const deleteBook = async (id: string) => {
    return await prisma.book.delete({
        where: { id },
        select: {
            title: true,
        }
    })
}

export const updateBook = async (id: string, data: Prisma.BookUpdateInput) => {
    return await prisma.book.update({
        where: { id },
        data,
        select: {
            title: true,
            genre: true,
            publishedYear: true,
            available: true
        }
    })
}