import { type Request, type Response } from "express";
import { getBorrowersService, addBorrowerService, getBorrowerByIdService, deleteBorrowerService, updateBorrowerService } from '../services/borrower.service.js'
import { Prisma } from "../generated/prisma/client.js";
import { BorrowerQuerySchema, CreateBorrower } from "../schemas/borrower.schema.js";
import { AppError } from "../utils/AppError.js";
import { ValidationError } from "../utils/ValidationError.js";


export const getBorrowersController = async (req: Request, res: Response) => {

    const query = BorrowerQuerySchema.safeParse(req.query);
    if (!query.success) throw new ValidationError("Invalid Input", query.error.issues)


    const Borrowers = await getBorrowersService(query.data);
    if (!Borrowers.length) throw new AppError("Book Not Found", 404)

    return res.status(200).send(Borrowers)
}


export const getBorrowerByIdController = async (req: Request, res: Response) => {
    const id = String(req.params.id);


    const Borrower = await getBorrowerByIdService(id);
    if (!Borrower) throw new AppError("Borrower Not Found", 404)
    return res.status(200).send(Borrower)
}


export const addBorrowerController = async (req: Request, res: Response) => {

    const result = CreateBorrower.safeParse(req.body)
    if (!result.success) throw new ValidationError("Invalid Data", result.error.issues)

    const Borrower = await addBorrowerService(result.data)
    return res.status(201).json({ message: "Borrower added" })

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
            return res.status(409).json({ error: "Borroweralready exists", message: "An Borrower with this emailalready exists." })
        }
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}