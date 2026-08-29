import { Prisma } from "../generated/prisma/client.js";
import type { RemoveUndefinedType } from "../middlewares/removeUndefined.js";
import { addLibrarian, getLibrarians, getLibrarianById, deleteLibrarian, updateLibrarian } from "../repositories/librarian.repository.js";
import type { CreateLibrarianType, LibrarianQuerySchemaType, UpdateLibrarianType } from "../schemas/librarian.schema.js";
import { AppError } from "../utils/AppError.js";


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
        await addLibrarian(data);

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
            if (err.code === "P2002") throw new AppError("Librarianalready exists", 409)
        }
    }
}


export const updateLibrarianService = async (id: string, data: RemoveUndefinedType<UpdateLibrarianType>) => {
    try {
        const updatedLibrarian = await updateLibrarian(id, data);
        return updatedLibrarian
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") throw new AppError(`Librarian already exists.`, 409)
            if (error.code === "P2025") throw new AppError("Librarian Not Found", 404)
        }
    }

}