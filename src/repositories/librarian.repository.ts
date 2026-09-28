import prisma from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
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
        // skip: (page - 1) * limit,
        // take: limit,
        // orderBy: {
        //     [sort]: order
        // }
    })
}
export const getLibrarianById = (id: string) => {
    return prisma.user.findUnique({
        where: {
            id,
            role:"LIBRARIAN"
        }
    })
}
export const addLibrarian = (data: Prisma.UserCreateInput) => {
    return prisma.user.create({
        data,

        select:{
            userName:true,
            email:true
        }
    })
}


export const deleteLibrarian = (id: string) => {
    return prisma.user.delete({
        where: { id },
        select: {
            userName: true,
        }
    })
}

export const updateLibrarian = (id: string, data: Prisma.UserUpdateInput) => {
    return prisma.user.update({
        where: {
            id:id
        }
        ,
        data,
        select: {
            userName:true,
            user:{
                select:{
                    userName:true,
                    email:true

                }
            }
        }

    })
}