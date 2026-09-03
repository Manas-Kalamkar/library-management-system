import { type Request, type Response } from "express"
import { addBookService, deleteBookService, getBookByIdService, getBooksService, updateBookService } from "../services/book.service.js"
import { BookQuerySchema, CreateBook } from "../schemas/book.schema.js"
import { ValidationError } from "../utils/ValidationError.js"
import { AppError } from "../utils/AppError.js"


export const getBooksController = async (req: Request, res: Response) => { 
    const query = BookQuerySchema.safeParse(req.query)

    if (!query.success) throw new ValidationError("Invalid Input", query.error.issues)

    const filteredBooks = await getBooksService(query.data);
    if (!filteredBooks) throw new AppError("Book Not Found", 404)

    return res.status(200).send(filteredBooks)

}

export const getBooksByIdController = async (req: Request, res: Response) => {
    const id = String(req.params.id)

    const book = await getBookByIdService(id);
    if (!book) throw new AppError("Book Not Found", 404)
    return res.status(200).send(book)
}



export const addBookController = async (req: Request, res: Response) => {

    const result = CreateBook.safeParse(req.body);
    if (!result.success) throw new ValidationError("Invalid Input", result.error.issues)

    const book = await addBookService(result.data);
    return res.status(201).send("Book added");
}


export const deleteBookController = async (req: Request, res: Response) => {
    const id = String(req.params.id)


    const book = await deleteBookService(id);
    return res.status(200).send(book)

}


export const updateBookController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    const data = req.body;
    const book = await updateBookService(id, data);
    return res.status(200).send(book)

}
