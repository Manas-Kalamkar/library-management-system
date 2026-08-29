import prisma from "../config/prisma.js";
import type { BookQuerySchemaType, CreateBookType, UpdateBookType } from "../schemas/book.schema.js";
import { addBook, deleteBook, getBooks, getBooksById, updateBook } from "../repositories/book.repository.js";
import type { RemoveUndefinedType } from "../middlewares/removeUndefined.js";
import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../utils/AppError.js";


export const getBooksService = async (query: BookQuerySchemaType) => {
    const books = await getBooks(query);

    return books;
};

export const getBookByIdService = async (id: string) => {

    const book = await getBooksById(id)

    return book;
}


export const addBookService = async (data: CreateBookType) => {
    try {
        const book = await addBook(data);
        return book;

    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2002") throw new AppError(`Book already exists.`, 409)
        }
    }

}


export const deleteBookService = async (id: string) => {
    try {
        const deletedBook = await deleteBook(id);
        return deletedBook;
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025") throw new AppError("Book Not Found", 404)
            if (err.code === "P2003") throw new AppError("Book cannot be deleted because related records exits", 409)
        }
    }
}

export const updateBookService = async (id: string, data: RemoveUndefinedType<UpdateBookType>) => {
    try {
        const updatedBook = await updateBook(id, data);
        return updatedBook;
    } catch (err) {

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2002") throw new AppError(`Book already exists.`, 409)
            if (err.code === "P2025") throw new AppError("Author Not Found", 404)
        }
    }
}