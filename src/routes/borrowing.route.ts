import { Router } from "express";
import { addBorrowingsController, deleteBorrowingController, getBorrowingByIdController, getBorrowingsController, updateBorrowingController } from "../controllers/borrowing.controller.js";
import { removeUndefinedMiddleware } from "../middlewares/removeUndefined.js";
import { UpdateBorrowing } from "../schemas/borrowing.schema.js";
import { requireAuth,requireRole } from "../middlewares/auth.js";


const borrowingRouter = Router();

borrowingRouter.get('/',requireAuth,requireRole(["LIBRARIAN","ADMIN"]), getBorrowingsController)
borrowingRouter.post('/',requireAuth,requireRole(["LIBRARIAN","ADMIN"]), addBorrowingsController)
borrowingRouter.get('/:id',requireAuth,requireRole(["LIBRARIAN","ADMIN"]), getBorrowingByIdController)
borrowingRouter.patch('/:id',requireAuth,requireRole(["LIBRARIAN","ADMIN"]), removeUndefinedMiddleware(UpdateBorrowing), updateBorrowingController)
borrowingRouter.delete('/:id',requireAuth,requireRole(["LIBRARIAN","ADMIN"]), deleteBorrowingController)


export default borrowingRouter