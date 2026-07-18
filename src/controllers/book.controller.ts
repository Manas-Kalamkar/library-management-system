import { type Request, type Response } from "express"
import { type Book, type BookBody, type BookQuery } from "../types.js"
import * as z from 'zod'
import { addBookService, borrowBookService, deleteBookService, getBookByIdService, getBooksByQueryService, updateBookService } from "../services/book.service.js"

export const getBooks = (req: Request<{}, {}, {}, BookQuery>, res: Response) => {


    const filteredBooks = getBooksByQueryService(req.query);

    if (filteredBooks.length > 0) return res.status(200).send(filteredBooks)

    return res.status(404).json({ error: "No Books Available" })
}


interface BookParam {
    id: string
}
export const getBooksById = (req: Request<BookParam>, res: Response) => {
    const id = Number(req.params.id)

    if (!Number.isInteger(id) || id < 1) return res.status(400).send("<p>Please check the id. Insert correct id.</p>");

    try {
        const book = getBookByIdService(id);
        return res.status(200).send(book)
    } catch (e) {
        return res.status(400).send(e)
    }
}

const BookBodySchema = z.object({
    title: z.string(),
    author: z.string(),
    genre: z.string(),
    publishedYear: z.string(),
    available: z.enum(["Yes", "No"]),
    borrowerName: z.string(),
    borrowedDate: z.coerce.string().nullable()
})


export const addBook = (req: Request<{}, {}, BookBody>, res: Response) => {
    const result = BookBodySchema.safeParse(req.body);
    if (!result.success) return res.status(400).send("<p>Invalid Book data</p>")

    try {
        addBookService(result.data);
        res.status(201).send("Book added")
    } catch (e) {
        return res.status(400).send(e)
    }

}


export const updateBook = (req: Request<BookParam>, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid id" })

    const result = BookBodySchema.partial().safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error?.message })

    try {
        updateBookService(id, result.data)
        res.status(200).send("Updated Successfully.")
    } catch (e) {
        return res.status(404).send(e);
    }
}


export const deleteBook = (req: Request<BookParam>, res: Response) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Bad Request" });

    try {
        deleteBookService(id);
        return res.status(200).send("Deleted Successfully");
    } catch (e) {
        return res.status(404).send(e)
    }
}

const BookBorrowSchema = z.object({
    borrowerName: z.string().toLowerCase(),
    borrowedDate: z.string()
})


export const borrowBook = async (req: Request<BookParam>, res: Response) => {
    const id = Number(req.params.id);
    const result = BookBorrowSchema.safeParse(req.body);

    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Book id is invalid" });

    if (!result.success) return res.status(400).json({ error: "Invalid Data" });

    try {
        const message = await borrowBookService(id, result.data);
        return res.status(200).send(message);
    } catch (e) {
        return res.status(400).json({
            error: e instanceof Error ? e.message : "Something went wrong"
        })
    }
}