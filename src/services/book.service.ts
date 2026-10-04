import type { BookQuerySchemaType, CreateBookType, UpdateBookType } from "../schemas/book.schema.js";
import { addBook, deleteBook, getBooks, getBooksById, updateBook } from "../repositories/book.repository.js";
import { handlePrismaError } from "../utils/prismaErrors.js";


export const getBooksService = async (query: BookQuerySchemaType) => {
    return await getBooks(query);
};

export const getBookByIdService = async (id: string) => {
    return await getBooksById(id);
}


export const addBookService = async (data: CreateBookType) => {
    try {
        return await addBook(data);
    } catch (error) {
        return handlePrismaError(error, {
            P2002: "Book already exists.",
            P2003: "Author does not exist.",
        })
    }
}


export const deleteBookService = async (id: string) => {
    try {
        return await deleteBook(id);
    } catch (error) {
        return handlePrismaError(error, {
            P2025: "Book Not Found",
            P2003: "Book cannot be deleted because related records exist",
        })
    }
}

export const updateBookService = async (id: string, data: UpdateBookType) => {
    try {
        return await updateBook(id, data);
    } catch (error) {
        return handlePrismaError(error, {
            P2002: "Book already exists.",
            P2025: "Book Not Found",
            P2003: "Author does not exist.",
        })
    }
}
