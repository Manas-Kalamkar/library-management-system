import prisma from "../config/prisma.js"
import type { RemoveUndefinedType } from "../middlewares/removeUndefined.js";
import { addAuthor, getAuthors, getAuthorById, deleteAuthor, updateAuthor } from "../repositories/author.repository.js";
import type { AuthorQuerySchemaType, CreateAuthorType, UpdateAuthorType } from "../schemas/author.schema.js";






export const getAuthorsService = async (query: AuthorQuerySchemaType) => {

    const authors = await getAuthors(query);
    return authors
}


export const getAuthorByIdService = async (id: string) => {
    const authors = await getAuthorById(id);
    return authors
}

export const addAuthorService = async (data: CreateAuthorType) => {
    const author = await addAuthor(data)
    return author;
}


export const deleteAuthorService = async (id: string) => {
    const authors = await deleteAuthor(id);
    return authors
}


export const updateAuthorService = async (id: string, data: RemoveUndefinedType<UpdateAuthorType>) => {
    const updatedAuthor = await updateAuthor(id, data);
    return updatedAuthor;
}
