import prisma from "../config/prisma.js";
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

    return prisma.borrower.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
            [sort]: order
        }
    })
}
export const getBorrowerById = (id: string) => {
    return prisma.borrower.findUnique({
        where: {
            id
        }
    })
}
export const addBorrower = (data: CreateBorrowerType) => {
    return prisma.borrower.create({
        data
    })
}


export const deleteBorrower = (id: string) => {
    return prisma.borrower.delete({
        where: { id },
        select: {
            name: true,
        }
    })
}
export const updateBorrower = (id: string, data: RemoveUndefinedType<UpdateBorrowerType>) => {
    return prisma.borrower.update({
        where: { id },
        data,
        select: {
            name: true,
        }
    })
}