import { type Request, type Response } from "express";
import { getBorrowersService, addBorrowerService, getBorrowerByIdService, deleteBorrowerService, updateBorrowerService } from '../services/borrower.service.js'
import { Prisma } from "../generated/prisma/client.js";
import { BorrowerQuerySchema, CreateBorrower } from "../schemas/borrower.schema.js";


export const getBorrowersController = async (req: Request, res: Response) => {

    const query = BorrowerQuerySchema.safeParse(req.body);
    if (!query.success) return res.status(401).json({ error: query.error.message })


    const Borrowers = await getBorrowersService(query.data);
    if (Borrowers) {
        return res.status(200).send(Borrowers)
    }
    return res.status(404).json({ error: "No Borrower found" })
}


export const getBorrowerByIdController = async (req: Request, res: Response) => {
    const id = String(req.params.id);


    const Borrowers = await getBorrowerByIdService(id);
    if (Borrowers) {
        return res.status(200).send(Borrowers)
    }
    return res.status(404).json({ error: "No Borrower found" })
}


export const addBorrowerController = async (req: Request, res: Response) => {

    const result = CreateBorrower.safeParse(req.body)
    if (!result.success) return res.status(400).json({ error: "Invalid Borrower Data", details: result.error.issues })

    try {
        const Borrower = await addBorrowerService(result.data)
        return res.status(201).json({ message: "Borrower added" })
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return res.status(409).json({ error: "Borrower already exists", message: "An Borrower with this email already exists." })
        }
        return res.status(500).json({
            error: "Internal server error", details: e
        });
    }
}

export const deleteBorrowerController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    try {
        const deletedBorrower = await deleteBorrowerService(id)
        return res.status(200).json({ deletedBorrower: deletedBorrower })
    } catch (e) {
        return res.status(400).send(e)
    }

}


export const updateBorrowerController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    const result = req.body
    try {
        const Borrower = await updateBorrowerService(id, result)
        res.status(201).json({ message: "Borrower added", Borrower })
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return res.status(409).json({ error: "Borrower already exists", message: "An Borrower with this email already exists." })
        }
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}