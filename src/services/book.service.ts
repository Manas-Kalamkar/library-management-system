import prisma from "../config/prisma.js";
import type { BookQuerySchemaType, CreateBookType, UpdateBookType } from "../schemas/book.schema.js";
import { addBook, deleteBook, getBooks, getBooksById, updateBook } from "../repositories/book.repository.js";
import type { RemoveUndefinedType } from "../middlewares/removeUndefined.js";


export const getBooksService = async (query: BookQuerySchemaType) => {
    const books = await getBooks(query);

    return books;
};

export const getBookByIdService = async (id: string) => {

    const book = await getBooksById(id)

    return book;
}


export const addBookService = async (data: CreateBookType) => {
    const book = await addBook(data);
    return book
}


export const deleteBookService = async (id: string) => {
    const deletedBook = await deleteBook(id);

    return deletedBook;
}

export const updateBookService = async (id: string, data: RemoveUndefinedType<UpdateBookType>) => {
    const updatedBook = await updateBook(id, data);
    return updatedBook;
}