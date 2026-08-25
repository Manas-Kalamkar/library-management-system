import type { Request, Response } from "express"
import { addBorrowingsService, deleteBorrowingsService, getBorrowingByIdService, getBorrowingsService, updateBorrowingService } from "../services/borrowing.service.js"
import { BorrowingQuerySchema, CreateBorrowing, UpdateBorrowing, type CreateBorrowingType } from "../schemas/borrowing.schema.js"




export const getBorrowingsController = async (req: Request, res: Response) => {

    const  query = BorrowingQuerySchema.safeParse(req.query)
    if(!query.success) return res.status(401).json({error:query.error.issues})

    console.log(query.data)

    const books = await getBorrowingsService(query.data)
    return res.status(200).json({ data: books })
}


export const getBorrowingByIdController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    const book = await getBorrowingByIdService(id)
    return res.status(200).json({ data: book })
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

    if (!data.success) {
        return res.status(400).json({
            error: data.error.issues,
        });
    }


    try {
        const result = await addBorrowingsService(data.data);

        return res.status(201).json(result);
    } catch (error) {
        return res.status(400).json({
            error,
        });
    }
}
    ;

export const updateBorrowingController = async (req: Request, res: Response) => {
    const id = String(req.params.id)


    const books = await updateBorrowingService(id, req.body)
    return res.status(200).json({ data: books })
}


export const deleteBorrowingController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    const book = await deleteBorrowingsService(id)
    return res.status(200).json({ data: book })
}

