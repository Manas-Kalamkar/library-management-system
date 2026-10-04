import { Prisma } from "../generated/prisma/client.js";
import { addAuthor, getAuthors, getAuthorById, deleteAuthor, updateAuthor } from "../repositories/author.repository.js";
import type { AuthorQuerySchemaType, CreateAuthorType } from "../schemas/author.schema.js";
import { handlePrismaError } from "../utils/prismaErrors.js";


export const getAuthorsService = async (query: AuthorQuerySchemaType) => {
    return await getAuthors(query);
}


export const getAuthorByIdService = async (id: string) => {
    return await getAuthorById(id);
}


export const addAuthorService = async (data: CreateAuthorType) => {
    try {
        return await addAuthor(data);
    } catch (error) {
        return handlePrismaError(error, { P2002: "Author already exists." })
    }
}


export const deleteAuthorService = async (id: string) => {
    try {
        return await deleteAuthor(id);
    } catch (error) {
        return handlePrismaError(error, {
            P2003: "Author cannot be deleted because related records exist",
            P2025: "Author Not Found",
        })
    }
}


export const updateAuthorService = async (id: string, data: Prisma.AuthorUpdateInput) => {
    try {
        return await updateAuthor(id, data);
    } catch (error) {
        return handlePrismaError(error, {
            P2002: "Author already exists.",
            P2025: "Author Not Found",
        })
    }
}
