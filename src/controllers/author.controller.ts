import { type Request, type Response } from "express";
import { getAuthorsService, addAuthorService, getAuthorByIdService, deleteAuthorService, updateAuthorService } from "../services/author.service.js";
import { Prisma } from "../generated/prisma/client.js";
import { AuthorQuerySchema, CreateAuthor } from "../schemas/author.schema.js";
import { AppError } from "../utils/AppError.js";
import { ValidationError } from "../utils/ValidationError.js";


export const getAuthorsController = async (req: Request, res: Response) => {
    const query = AuthorQuerySchema.safeParse(req.query)
    if (!query.success) throw new ValidationError("Invalid Input", query.error.issues)

    const authors = await getAuthorsService(query.data);
    if (!authors) { throw new AppError("Author not found", 404) }

    return res.status(200).json(authors)
}

export const getAuthorByIdController = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const author = await getAuthorByIdService(id);
    if (!author) { throw new AppError("Author not found", 404) }

    return res.status(200).json(author)
}


export const addAuthorController = async (req: Request, res: Response) => {
    const result = CreateAuthor.safeParse(req.body)

    if (!result.success) throw new ValidationError("Invalid Input", result.error.issues)

    const author = await addAuthorService(result.data)
    return res.status(201).json({ message: "Author added", author })

}

export const deleteAuthorController = async (req: Request, res: Response) => {

    const id = String(req.params.id)
    const deletedAuthor = await deleteAuthorService(id)
    return res.status(200).json({ deletedAuthor: deletedAuthor })

}


export const updateAuthorController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    const result = req.body
    const author = await updateAuthorService(id, result)
    res.status(201).json({ message: "Author updated", author })


}