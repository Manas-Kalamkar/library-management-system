import { Router } from "express"
import { getBorrowersController, getBorrowerByIdController,addBorrowerController,deleteBorrowerController, updateBorrowerController } from "../controllers/borrower.controller.js"
import {  removeUndefinedMiddleware } from "../middlewares/removeUndefined.js"
import { UpdateBorrower } from "../schemas/borrower.schema.js"
import { requireAuth, requireRole } from "../middlewares/auth.js"


const borrowerRouter =  Router()


borrowerRouter.get("/",requireAuth,requireRole(["LIBRARIAN"]),getBorrowersController)
borrowerRouter.get("/:id",requireAuth,requireRole(["LIBRARIAN"]),getBorrowerByIdController)
borrowerRouter.post("/",requireAuth,requireRole(["LIBRARIAN"]),addBorrowerController)
borrowerRouter.delete("/:id",requireAuth,requireRole(["LIBRARIAN"]),deleteBorrowerController)

borrowerRouter.patch("/:id",removeUndefinedMiddleware(UpdateBorrower),updateBorrowerController)


export default borrowerRouter