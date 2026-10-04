import { Router } from "express"
import { getBorrowersController, getBorrowerByIdController,addBorrowerController,deleteBorrowerController, updateBorrowerController } from "../controllers/borrower.controller.js"
import { requireAuth, requireRole } from "../middlewares/auth.js"


const borrowerRouter =  Router()

borrowerRouter.use(requireAuth,requireRole(["LIBRARIAN","ADMIN"]),)

borrowerRouter.get("/",requireAuth,getBorrowersController)
borrowerRouter.get("/:id",requireAuth,getBorrowerByIdController)
borrowerRouter.post("/",requireAuth,addBorrowerController)
borrowerRouter.delete("/:id",requireAuth,deleteBorrowerController)

borrowerRouter.patch("/:id",updateBorrowerController)


export default borrowerRouter