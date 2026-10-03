import { type Request, type Response } from "express";
import { getBorrowersService, addBorrowerService, getBorrowerByIdService, deleteBorrowerService, updateBorrowerService } from '../services/borrower.service.js'
import { BorrowerQuerySchema, CreateBorrower, UpdateBorrower } from "../schemas/borrower.schema.js";
import { AppError } from "../utils/AppError.js";
import { ValidationError } from "../utils/ValidationError.js";


export const getBorrowersController = async (req: Request, res: Response) => {

    const query = BorrowerQuerySchema.safeParse(req.query);
    if (!query.success) throw new ValidationError("Invalid Input", query.error.issues)

    const borrowers = await getBorrowersService(query.data);
    return res.status(200).send(borrowers)
}


export const getBorrowerByIdController = async (req: Request, res: Response) => {
    const id = String(req.params.id);

    const borrower = await getBorrowerByIdService(id);
    if (!borrower) throw new AppError("Borrower Not Found", 404)
    return res.status(200).send(borrower)
}


export const addBorrowerController = async (req: Request, res: Response) => {

    const result = CreateBorrower.safeParse(req.body)
    if (!result.success) throw new ValidationError("Invalid Data", result.error.issues)

    await addBorrowerService(result.data)
    return res.status(201).json({ message: "Borrower added" })

}


export const deleteBorrowerController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    const deletedBorrower = await deleteBorrowerService(id)
    return res.status(200).json({ deletedBorrower })
}


export const updateBorrowerController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    const result = UpdateBorrower.safeParse(req.body)

    if (!result.success) throw new ValidationError("Invalid Data", result.error.issues)

    const borrower = await updateBorrowerService(id, result.data)
    res.status(200).json({ message: "Borrower updated", borrower })
}
