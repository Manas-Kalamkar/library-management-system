import prisma from "../config/prisma.js"
import { Prisma } from "../generated/prisma/client.js";
import type { RemoveUndefinedType } from "../middlewares/removeUndefined.js";
import { addAuthor, getAuthors, getAuthorById, deleteAuthor, updateAuthor } from "../repositories/author.repository.js";
import type { AuthorQuerySchemaType, CreateAuthorType, UpdateAuthorType } from "../schemas/author.schema.js";
import { AppError } from "../utils/AppError.js";





export const getAuthorsService = async (query: AuthorQuerySchemaType) => {
    const authors = await getAuthors(query);
    return authors
}


export const getAuthorByIdService = async (id: string) => {
    const authors = await getAuthorById(id);
    return authors
}


export const addAuthorService = async (data: CreateAuthorType) => {
    try {
        return await addAuthor(data);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") throw new AppError(`Author already exists.`, 409)
        }

    }
}


export const deleteAuthorService = async (id: string) => {
    try {
        const deletedAuthor = await deleteAuthor(id);
        return deletedAuthor;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2003") throw new AppError("Author cannot be deleted because related records exist", 409)
            if (error.code === "P2025") throw new AppError("Author Not Found", 404)
        }
    }
}



export const updateAuthorService = async (id: string, data: RemoveUndefinedType<UpdateAuthorType>) => {
    try {
        const updatedAuthor = await updateAuthor(id, data);
        return updatedAuthor;

    } catch (err) {

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2002") throw new AppError(`Author already exists.`, 409)
            if (err.code === "P2025") throw new AppError("Author Not Found", 404)
        }
    }
}
