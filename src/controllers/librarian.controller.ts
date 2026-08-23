import { type Request, type Response } from "express";
import { getLibrariansService, addLibrarianService, getLibrarianByIdService, deleteLibrarianService, updateLibrarianService } from "../services/librarian.service.js";
import * as z from 'zod'
import { Prisma } from "../generated/prisma/client.js";
import { CreateLibrarian, LibrarianQuerySchema, UpdateLibrarian, type UpdateLibrarianType } from "../schemas/librarian.schema.js";
import type { RemoveUndefinedType } from "../middlewares/removeUndefined.js";


export const getLibrariansController = async (req: Request, res: Response) => {
    const query = LibrarianQuerySchema.safeParse(req.query)

    if (!query.success) return res.status(401).json({ error: query.error.message })

    const Librarians = await getLibrariansService(query.data);
    if (Librarians) {
        return res.status(200).send(Librarians)
    }
    return res.status(404).json({ error: "No Librarian found" })
}

export const getLibrarianByIdController = async (req: Request, res: Response) => {
    const id = String(req.params.id);


    const Librarians = await getLibrarianByIdService(id);
    if (Librarians) {
        return res.status(200).send(Librarians)
    }
    return res.status(404).json({ error: "No Librarian found" })
}


export const addLibrarianController = async (req: Request, res: Response) => {

    const arr = req.body;

    for (let i = 0; i < arr.length; i++) {
        const result = CreateLibrarian.safeParse(arr[i])
        if (!result.success) return res.status(400).json({ error: "Invalid Librarian Data", details: result.error.issues })

        try {
            const Librarian = await addLibrarianService(result.data)
            res.status(201).json({ message: "Librarian added", Librarian })
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                return res.status(409).json({ error: "Librarian already exists", message: "An Librarian with this name and email already exists." })
            }
            return res.status(500).json({
                error: "Internal server error"
            });
        }
    }
}
export const deleteLibrarianController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    try {
        const deletedLibrarian = await deleteLibrarianService(id)
        return res.status(200).json({ deletedLibrarian: deletedLibrarian })
    } catch (e) {
        return res.status(400).send(e)
    }

}


export const updateLibrarianController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    const data: RemoveUndefinedType<UpdateLibrarianType> = req.body;
    try {
        const updateLibrarian = await updateLibrarianService(id, data)
        return res.status(200).json({ updateLibrarian: updateLibrarian })
    } catch (e) {
        return res.status(404).json({ error: e })
    }
}