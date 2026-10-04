import { type Request, type Response } from "express";
import { getLibrariansService, addLibrarianService, getLibrarianByIdService, deleteLibrarianService, updateLibrarianService } from "../services/librarian.service.js";
import { CreateLibrarian, LibrarianQuerySchema,  UpdateLibrarian } from "../schemas/librarian.schema.js";
import { ValidationError } from "../utils/ValidationError.js";
import { AppError } from "../utils/AppError.js";


export const getLibrariansController = async (req: Request, res: Response) => {
    const query = LibrarianQuerySchema.safeParse(req.query)

    if (!query.success) throw new ValidationError("Invalid Input", query.error.issues)

    const Librarians = await getLibrariansService(query.data);
    if (!Librarians) {
        throw new AppError("Librarian Not Found", 404)
    }
    return res.status(200).send(Librarians)
}

export const getLibrarianByIdController = async (req: Request, res: Response) => {
    const id = String(req.params.id);


    const Librarian = await getLibrarianByIdService(id);
    if (!Librarian) {
        throw new AppError("Librarian Not Found", 404)
    }
    return res.status(200).send(Librarian)
}


export const addLibrarianController = async (req: Request, res: Response) => {


    const result = CreateLibrarian.safeParse(req.body)
    if (!result.success) throw new ValidationError("Invalid Librarian Data", result.error.issues)
    const Librarian = await addLibrarianService(result.data)
    res.status(201).json({ message: "Librarian added", Librarian })


}
export const deleteLibrarianController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    const deletedLibrarian = await deleteLibrarianService(id)
    return res.status(200).json({ deletedLibrarian: deletedLibrarian })


}


export const updateLibrarianController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    const data =  UpdateLibrarian.safeParse(req.body);
    if(!data.success) throw new ValidationError("Librarian Update Input Data.",data.error)
    const updateLibrarian = await updateLibrarianService(id, data.data)
    return res.status(200).json({ updateLibrarian: updateLibrarian })

}