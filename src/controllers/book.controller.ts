import { type Request, type Response } from "express"
import { addBookService, deleteBookService, getBookByIdService, getBooksService, updateBookService } from "../services/book.service.js"
import { BookQuerySchema, CreateBook } from "../schemas/book.schema.js"

export const getBooksController = async (req: Request, res: Response) => {

    const query = BookQuerySchema.safeParse(req.query)

    if (!query.success) return res.status(401).json({ error: query.error.message })

    const filteredBooks = await getBooksService(query.data);

    if (filteredBooks.length > 0) return res.status(200).send(filteredBooks)

    return res.status(404).json({ error: "No Books Available" })
}

export const getBooksByIdController = async (req: Request, res: Response) => {
    const id = String(req.params.id)

    // if (!Number.isInteger(id) || id < 1) return res.status(400).send("<p>Please check the id. Insert correct id.</p>");

    try {
        const book = await getBookByIdService(id);
        return res.status(200).send(book)
    } catch (e) {
        return res.status(400).send(e)
    }
}



export const addBookController = (req: Request, res: Response) => {

    const result = CreateBook.safeParse(req.body);
    if (!result.success) return res.status(400).send("<p>Invalid Book data</p>")

    try {
        addBookService(result.data);
        res.status(201).send("Book added")
    } catch (e) {
        return res.status(400).send(e)
    }

}

export const deleteBookController = async (req: Request, res: Response) => {
    const id = String(req.params.id)


    try {
        const book = await deleteBookService(id);
        return res.status(200).send(book)
    } catch (e) {
        return res.status(400).send(e)
    }
}


export const updateBookController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    const data = req.body;

    try {
        const book = await updateBookService(id, data);
        return res.status(200).send(book)
    } catch (e) {
        return res.status(400).send(e)
    }
}
