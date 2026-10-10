import { Prisma } from "../generated/prisma/client.js";
import { addLibrarian, getLibrarians, getLibrarianById, deleteLibrarian, updateLibrarian } from "../repositories/librarian.repository.js";
import type { CreateLibrarianType, LibrarianQuerySchemaType, UpdateLibrarianType } from "../schemas/librarian.schema.js";
import { handlePrismaError } from "../utils/prismaErrors.js";
import { hashPassword } from "../utils/security/password.js";
import { revokeAllUserTokens } from "./token.service.js";


export const getLibrariansService = async (query: LibrarianQuerySchemaType) => {
    return await getLibrarians(query);
}


export const getLibrarianByIdService = async (id: string) => {
    return await getLibrarianById(id);
}

export const addLibrarianService = async (data: CreateLibrarianType) => {
    try {
        const prismaCreateData: Prisma.UserCreateInput = {
            userName: data.name,
            email: data.email,
            password: await hashPassword(data.password),
            role: "LIBRARIAN",
            librarians: {
                create: {
                    name: data.name,
                    salary: data.salary,
                    joiningYear: data.joiningYear
                }
            }
        }
        return await addLibrarian(prismaCreateData);

    } catch (error) {
        return handlePrismaError(error, { P2002: "Librarian already exists." })
    }
}



export const deleteLibrarianService = async (id: string) => {
    try {
        return await deleteLibrarian(id);
    } catch (error) {
        return handlePrismaError(error, {
            P2025: "Librarian Not Found",
            P2003: "Librarian cannot be deleted because related records exist",
        })
    }
}


export const updateLibrarianService = async (id: string, data: UpdateLibrarianType) => {
    try {
        const prismaUpdateData: Prisma.UserUpdateInput = {
            ...(data.name !== undefined && { userName: data.name }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.password !== undefined && { password: await hashPassword(data.password) }),
            librarians: {
                update: {
                    ...(data.name !== undefined && { name: data.name }),
                    ...(data.salary !== undefined && { salary: data.salary }),
                    ...(data.joiningYear !== undefined && { joiningYear: data.joiningYear }),
                }
            }
        }

        const updatedLibrarian = await updateLibrarian(id, prismaUpdateData);

        if (data.password !== undefined) await revokeAllUserTokens(id)

        return updatedLibrarian
    } catch (error) {
        return handlePrismaError(error, {
            P2002: "Librarian already exists.",
            P2025: "Librarian Not Found",
        })
    }
}
