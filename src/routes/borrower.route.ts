import { Router } from "express"
import { getBorrowersController, getBorrowerByIdController,addBorrowerController,deleteBorrowerController, updateBorrowerController } from "../controllers/borrower.controller.js"
import {  removeUndefinedMiddleware } from "../middlewares/removeUndefined.js"
import { UpdateBorrower } from "../schemas/borrower.schema.js"
import { requireAuth, requireRole } from "../middlewares/auth.js"


const borrowerRouter =  Router()


borrowerRouter.get("/",requireAuth,requireRole(["LIBRARIAN","ADMIN"]),getBorrowersController)
borrowerRouter.get("/:id",requireAuth,requireRole(["LIBRARIAN","ADMIN"]),getBorrowerByIdController)
borrowerRouter.post("/",requireAuth,requireRole(["LIBRARIAN","ADMIN"]),addBorrowerController)
borrowerRouter.delete("/:id",requireAuth,requireRole(["LIBRARIAN","ADMIN"]),deleteBorrowerController)

borrowerRouter.patch("/:id",removeUndefinedMiddleware(UpdateBorrower),updateBorrowerController)


export default borrowerRouter