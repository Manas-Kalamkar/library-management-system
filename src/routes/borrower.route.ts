import { Router } from "express"
import { getBorrowersController, getBorrowerByIdController,addBorrowerController,deleteBorrowerController, updateBorrowerController } from "../controllers/borrower.controller.js"
import {  removeUndefinedMiddleware } from "../middlewares/removeUndefined.js"
import { UpdateBorrower } from "../schemas/borrower.schema.js"


const borrowerRouter =  Router()


borrowerRouter.get("/",getBorrowersController)
borrowerRouter.get("/:id",getBorrowerByIdController)
borrowerRouter.post("/",addBorrowerController)
borrowerRouter.delete("/:id",deleteBorrowerController)

borrowerRouter.patch("/:id",removeUndefinedMiddleware(UpdateBorrower),updateBorrowerController)


export default borrowerRouter