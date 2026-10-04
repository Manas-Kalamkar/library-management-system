import { Prisma } from "../generated/prisma/client.js";
import { addBorrower, getBorrowers, getBorrowerById, deleteBorrower, updateBorrower } from "../repositories/borrower.repository.js";
import type { BorrowerQuerySchemaType, CreateBorrowerType, UpdateBorrowerType } from "../schemas/borrower.schema.js";
import { handlePrismaError } from "../utils/prismaErrors.js";
import { hashPassword } from "../utils/security/password.js";
import { revokeAllUserTokens } from "./token.service.js";


export const getBorrowersService = async (query: BorrowerQuerySchemaType) => {
    return await getBorrowers(query);
}


export const getBorrowerByIdService = async (id: string) => {
    return await getBorrowerById(id);
}

export const addBorrowerService = async (data: CreateBorrowerType) => {
    try {
        const prismaCreateData: Prisma.UserCreateInput = {
            userName: data.name,
            email: data.email,
            // (previously the *plaintext* password was stored here - always hash it)
            password: await hashPassword(data.password),
            role: "BORROWER",
            borrowers: {
                create: {
                    name: data.name,
                    ...(data.joiningDate ? { joiningDate: data.joiningDate as string | Date } : {}),
                    phoneNo: data.phoneNo,
                }
            }
        }
        return await addBorrower(prismaCreateData)
    } catch (error) {
        return handlePrismaError(error, { P2002: "Borrower already exists." })
    }
}


export const deleteBorrowerService = async (id: string) => {
    try {
        return await deleteBorrower(id)
    } catch (error) {
        return handlePrismaError(error, {
            P2003: "Borrower cannot be deleted because related records exist",
            P2025: "Borrower Not Found",
        })
    }
}


export const updateBorrowerService = async (id: string, data: UpdateBorrowerType) => {
    try {
        const prismaUpdateData: Prisma.UserUpdateInput = {
            ...(data.name !== undefined && { userName: data.name }),
            ...(data.password !== undefined && { password: await hashPassword(data.password) }),
            ...(data.email !== undefined && { email: data.email }),
            borrowers: {
                update: {
                    ...(data.name !== undefined && { name: data.name }),
                    ...(data.joiningDate !== undefined && { joiningDate: data.joiningDate as string | Date}),
                    ...(data.phoneNo !== undefined && { phoneNo: data.phoneNo }),
                }
            }
        }
        const borrower = await updateBorrower(id, prismaUpdateData)

        // A password reset must kick out anyone holding the old credentials.
        if (data.password !== undefined) await revokeAllUserTokens(id)

        return borrower
    } catch (error) {
        return handlePrismaError(error, {
            P2002: "Borrower already exists",
            P2025: "Borrower Not Found",
        })
    }
}
