import prisma from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { RemoveUndefinedType } from "../middlewares/removeUndefined.js";
import type { BorrowerQuerySchemaType, CreateBorrowerType, UpdateBorrowerType } from "../schemas/borrower.schema.js";

export const getBorrowers = ({ search, joiningDate, page, limit, sort, order }: BorrowerQuerySchemaType) => {

    const where = {
        ...(search && {
            OR: [{
                name: {
                    contains: search, mode: 'insensitive' as const
                }
            }, {
                email: {
                    contains: search, mode: 'insensitive' as const
                },
            }, {
                phoneNo: {
                    contains: search
                }
            }]
        }),
        ...(joiningDate !== undefined && {
            joiningDate
        })
    }

    return prisma.user.findMany({
        where,
        // skip: (page - 1) * limit,
        // take: limit,
        // orderBy: {
        //     [sort]: order
        // }
    })
}
export const getBorrowerById = (id: string) => {
    return prisma.user.findUnique({
        where: {
            id
        }
    })
}
export const addBorrower = (data: Prisma.UserCreateInput) => {
    return prisma.user.create({
        data
    })
}


export const deleteBorrower = (id: string) => {
    return prisma.user.delete({
        where: { id },
        select: {
            userName: true,
        }
    })
}
export const updateBorrower = (id: string, data: Prisma.UserUpdateInput) => {
    return prisma.user.update({
        where: { id },
        data,
        select: {
            userName: true,
        }
    })
}