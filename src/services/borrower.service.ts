import prisma from "../config/prisma.js"
import type { RemoveUndefinedType } from "../middlewares/removeUndefined.js";
import { addBorrower, getBorrowers, getBorrowerById, deleteBorrower, updateBorrower } from "../repositories/borrower.repository.js";
import type { BorrowerQuerySchemaType, CreateBorrowerType, UpdateBorrowerType } from "../schemas/borrower.schema.js";






export const getBorrowersService = async (query : BorrowerQuerySchemaType) => {
    const Borrowers = await getBorrowers(query);
    return Borrowers
}


export const getBorrowerByIdService = async (id: string) => {
    const Borrowers = await getBorrowerById(id);
    return Borrowers
}

export const addBorrowerService = async (data: CreateBorrowerType) => {
    const Borrower = await addBorrower(data)
    return Borrower;
}


export const deleteBorrowerService = async (id: string) => {
    const Borrowers = await deleteBorrower(id);
    return Borrowers
}


export const updateBorrowerService = async (id : string, data: RemoveUndefinedType<UpdateBorrowerType>) => {
    const Borrower = await updateBorrower(id, data)
    return Borrower;
}
