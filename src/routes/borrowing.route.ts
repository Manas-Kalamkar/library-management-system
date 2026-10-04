import { Router } from "express";
import { addBorrowingsController, deleteBorrowingController, getBorrowingByIdController, getBorrowingsController, updateBorrowingController } from "../controllers/borrowing.controller.js";
import { requireAuth,requireRole } from "../middlewares/auth.js";


const borrowingRouter = Router();

borrowingRouter.use(requireAuth,requireRole(["LIBRARIAN","ADMIN"]))

borrowingRouter.get('/', getBorrowingsController)
borrowingRouter.post('/', addBorrowingsController)
borrowingRouter.get('/:id', getBorrowingByIdController)
borrowingRouter.patch('/:id', updateBorrowingController)
borrowingRouter.delete('/:id', deleteBorrowingController)


export default borrowingRouter