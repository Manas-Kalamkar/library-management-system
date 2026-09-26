import prisma from "../config/prisma.js"
import { Prisma } from "../generated/prisma/client.js";
import { hashPassword } from "../middlewares/hashPassword.js";
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
        const password = await hashPassword(data.password)
        const prismaCreateData: Prisma.UserCreateInput = {
            userName: data.name,
            email: data.email,
            password: data.password,
            role: "BORROWER",
            borrowers: {
                create: {
                    name: data.name,
                    joiningDate: data.joiningDate,
                    phoneNo: data.phoneNo,

                }
            }
        }
        const Borrower = await addBorrower(prismaCreateData)
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


export const updateBorrowerService = async (id: string, data: UpdateBorrowerType) => {
    try {
        
        data.password = data.password ? await hashPassword(data.password) : undefined
        const prismaUpdateData: Prisma.UserUpdateInput = {
            userName: data.name,
            password: data.password,
            email: data.email,
            role:"BORROWER",
            borrowers:{
                update:{
                    name:data.name,
                    joiningDate:data.joiningDate,
                    phoneNo:data.phoneNo
                }
            }

        }
        const Borrower = await updateBorrower(id, prismaUpdateData)
        return Borrower;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") throw new AppError("Borrower already exists", 409)
            if (error.code === "P2025") throw new AppError("Borrower Not Found", 404)
        }
    }
}
