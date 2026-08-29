import prisma from "../config/prisma.js"
import { Prisma } from "../generated/prisma/client.js";
import type { RemoveUndefinedType } from "../middlewares/removeUndefined.js";
import { addBorrower, getBorrowers, getBorrowerById, deleteBorrower, updateBorrower } from "../repositories/borrower.repository.js";
import type { BorrowerQuerySchemaType, CreateBorrowerType, UpdateBorrowerType } from "../schemas/borrower.schema.js";
import { AppError } from "../utils/AppError.js";






export const getBorrowersService = async (query: BorrowerQuerySchemaType) => {
    const Borrowers = await getBorrowers(query);
    return Borrowers
}


export const getBorrowerByIdService = async (id: string) => {
    const Borrowers = await getBorrowerById(id);
    return Borrowers
}

export const addBorrowerService = async (data: CreateBorrowerType) => {
    try {
        const Borrower = await addBorrower(data)
        return Borrower;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") throw new AppError("Borrower already exists.", 409)
        }
    }
}


export const deleteBorrowerService = async (id: string) => {
    try {
        const Borrowers = await deleteBorrower(id);
        return Borrowers
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2003") throw new AppError("Borrower cannot be deleted because related records exist", 409)
            if (error.code === "P2025") throw new AppError("Borrower Not Found", 404)
        }
    }
}


export const updateBorrowerService = async (id: string, data: RemoveUndefinedType<UpdateBorrowerType>) => {
    try {
        const Borrower = await updateBorrower(id, data)
        return Borrower;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") throw new AppError("Borrower already exists", 409)
            if (error.code === "P2025") throw new AppError("Borrower Not Found", 404)
        }
    }
}
