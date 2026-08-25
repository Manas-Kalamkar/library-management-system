import { Router } from "express";
import { addBorrowingsController, deleteBorrowingController, getBorrowingByIdController, getBorrowingsController, updateBorrowingController } from "../controllers/borrowing.controller.js";
import { removeUndefinedMiddleware } from "../middlewares/removeUndefined.js";
import { UpdateBorrowing } from "../schemas/borrowing.schema.js";


const borrowingRouter = Router();

borrowingRouter.post('/', addBorrowingsController)
borrowingRouter.get('/', getBorrowingsController)
borrowingRouter.get('/:id', getBorrowingByIdController)
borrowingRouter.patch('/:id', removeUndefinedMiddleware(UpdateBorrowing), updateBorrowingController)
borrowingRouter.delete('/:id', deleteBorrowingController)


export default borrowingRouter