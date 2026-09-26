import { Prisma } from "../generated/prisma/client.js";
import { hashPassword } from "../middlewares/hashPassword.js";
import type { RemoveUndefinedType } from "../middlewares/removeUndefined.js";
import { addLibrarian, getLibrarians, getLibrarianById, deleteLibrarian, updateLibrarian } from "../repositories/librarian.repository.js";
import type { CreateLibrarianType, LibrarianQuerySchemaType, UpdateLibrarianType } from "../schemas/librarian.schema.js";
import { AppError } from "../utils/AppError.js";
import bcrypt from "bcrypt"


export const getLibrariansService = async (query: LibrarianQuerySchemaType) => {
    const Librarians = await getLibrarians(query);
    return Librarians
}


export const getLibrarianByIdService = async (id: string) => {
    const Librarians = await getLibrarianById(id);
    return Librarians
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
        if (error instanceof Prisma.PrismaClientKnownRequestError)
            if (error.code === "P2002") throw new AppError(`Librarian already exists.`, 409)
    }
}



export const deleteLibrarianService = async (id: string) => {
    try {
        const Librarians = await deleteLibrarian(id);
        return Librarians
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025") throw new AppError("Librarian Not Found", 404)
            if (err.code === "P2002") throw new AppError("Librarian already exists", 409)
        }
    }
}


export const updateLibrarianService = async (id: string, data: UpdateLibrarianType) => {
    try {
        const prismaUpdateData: Prisma.LibrarianUpdateInput = {
            name: data.name,
            salary: data.salary,
            joiningYear: data.joiningYear,
            user: {
                update: {
                    userName: data.name,
                    email: data.email,
                    password: data.password ? await hashPassword(data.password) : undefined
                }
            }

        }

        const updatedLibrarian = await updateLibrarian(id, prismaUpdateData);
        return updatedLibrarian
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") throw new AppError(`Librarian already exists.`, 409)
            if (error.code === "P2025") throw new AppError("Librarian Not Found", 404)
        }
    }

}