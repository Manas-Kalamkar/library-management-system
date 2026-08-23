import { type Request, type Response } from "express";
import { getAuthorsService, addAuthorService, getAuthorByIdService, deleteAuthorService, updateAuthorService } from "../services/author.service.js";
import * as z from 'zod'
import { Prisma } from "../generated/prisma/client.js";
import { AuthorQuerySchema, CreateAuthor } from "../schemas/author.schema.js";


export const getAuthorsController = async (req: Request, res: Response) => {
    const query = AuthorQuerySchema.safeParse(req.query)

    if (!query.success) return res.status(404).send({ error: query.error.message })


    const authors = await getAuthorsService(query.data);
    if (authors) {
        return res.status(200).send(authors)
    }
    return res.status(404).json({ error: "No author found" })
}

export const getAuthorByIdController = async (req: Request, res: Response) => {
    const id = String(req.params.id);


    const authors = await getAuthorByIdService(id);
    if (authors) {
        return res.status(200).send(authors)
    }
    return res.status(404).json({ error: "No author found" })
}


export const addAuthorController = async (req: Request, res: Response) => {
    const result = CreateAuthor.safeParse(req.body)
    if (!result.success) return res.status(400).json({ error: "Invalid Author Data", details: result.error.issues })

    try {
        const author = await addAuthorService(result.data)
        res.status(201).json({ message: "Author added", author })
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return res.status(409).json({ error: "Author already exists", message: "An author with this name and birth year already exists." })
        }
        return res.status(500).json({
            error: "Internal server error"
        });
    }

}
export const deleteAuthorController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    try {
        const deletedAuthor = await deleteAuthorService(id)
        return res.status(200).json({ deletedAuthor: deletedAuthor })
    } catch (e) {
        return res.status(400).send(e)
    }

}




export const updateAuthorController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    const result = req.body
    try {
        const author = await updateAuthorService(id, result)
        res.status(201).json({ message: "Author added", author })
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return res.status(409).json({ error: "Author already exists", message: "An author with this name and birth year already exists." })
        }
        return res.status(500).json({
            error: "Internal server error"
        });
    }

}