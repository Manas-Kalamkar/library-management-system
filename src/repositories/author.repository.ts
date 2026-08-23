import prisma from "../config/prisma.js";
import type { RemoveUndefinedType } from "../middlewares/removeUndefined.js";
import type { AuthorQuerySchemaType, CreateAuthor, CreateAuthorType, UpdateAuthorType } from "../schemas/author.schema.js";

export const getAuthors = ({ search, name, birthYear, page, limit, sort, order }: AuthorQuerySchemaType) => {

    const where = {
        ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' as const } }] }),
        ...(name && { name: { contains: name, mode: 'insensitive' as const } }),
        ...(birthYear !== undefined && { birthYear, })
    }

    return prisma.author.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,

        orderBy: {
            [sort]: order
        }

    })
}
export const getAuthorById = (id: string) => {
    return prisma.author.findUnique({
        where: {
            id
        }
    })
}
export const addAuthor = (data: CreateAuthorType) => {
    return prisma.author.create({
        data
    })
}


export const deleteAuthor = (id: string) => {
    return prisma.author.delete({
        where: { id },
        select: {
            name: true,
        }
    })
}

export const updateAuthor = (id: string, data: RemoveUndefinedType<UpdateAuthorType>) => {
    return prisma.author.update({
        where: { id },
        data,
        select: {
            name: true,
        }
    })
}

