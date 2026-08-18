import prisma from "../config/prisma.js"
import { addAuthor, getAuthors, getAuthorById, deleteAuthor } from "../repository/author.repository.js";
import type { CreateAuthor } from "../types.js";






export const getAuthorsService = async () => {
    const authors = await prisma.author.findMany();
    return authors
}


export const getAuthorByIdService = async (id: string) => {
    const authors = await getAuthorById(id);
    return authors
}

export const addAuthorService = async (data: CreateAuthor) => {
    const author = await addAuthor(data)
    return author;
}


export const deleteAuthorService = async (id: string) => {
    const authors = await deleteAuthor(id);
    return authors
}
