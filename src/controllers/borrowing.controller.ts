import type { Request, Response } from "express"
import { addBorrowingsService, deleteBorrowingsService, getBorrowingByIdService, getBorrowingsService, updateBorrowingService } from "../services/borrowing.service.js"
import { BorrowingQuerySchema, CreateBorrowing, UpdateBorrowing, type CreateBorrowingType } from "../schemas/borrowing.schema.js"
import { ValidationError } from "../utils/ValidationError.js"




export const getBorrowingsController = async (req: Request, res: Response) => {

    const query = BorrowingQuerySchema.safeParse(req.query)
    if (!query.success) throw new ValidationError("Invalid Input",query.error.issues)


    const borrowings = await getBorrowingsService(query.data)
    return res.status(200).json({ data: borrowings })
}


export const getBorrowingByIdController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    const borrowing = await getBorrowingByIdService(id)
    
    return res.status(200).json({ data: borrowing })
}
// adding multiple borrowings in a array
// export const addBorrowingsController = async (req: Request, res: Response) => {
//     const arry = req.body;

//     const borr: CreateBorrowingType[] = [];

//     for (const i of arry) {
//         const data = CreateBorrowing.safeParse(i);

//         if (!data.success) {
//             return res.status(400).json({
//                 error: data.error.issues,
//             });
//         }

//         borr.push(data.data);
//     }

//     try {
//         const result = await addBorrowingsService(borr);

//         return res.status(201).json(result);
//     } catch (error) {
//         return res.status(400).json({
//             error,
//         });
//     }
// };
export const addBorrowingsController = async (req: Request, res: Response) => {


    const data = CreateBorrowing.safeParse(req.body);
    if (!data.success) throw new ValidationError("Invalid Input", data.error.issues)


    const result = await addBorrowingsService(data.data);
    return res.status(201).json(result);

}
    ;

export const updateBorrowingController = async (req: Request, res: Response) => {
    const id = String(req.params.id)


    const borrowings = await updateBorrowingService(id, req.body)
    return res.status(200).json({ data: borrowings })
}


export const deleteBorrowingController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    const borrowing = await deleteBorrowingsService(id)
    return res.status(200).json({ data: borrowing })
}

