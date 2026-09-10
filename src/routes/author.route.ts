import { Router } from "express"
import { getAuthorsController, getAuthorByIdController,addAuthorController,deleteAuthorController,updateAuthorController } from "../controllers/author.controller.js"
import { removeUndefinedMiddleware } from "../middlewares/removeUndefined.js"
import { UpdateAuthor } from "../schemas/author.schema.js"
import { requireAuth, requireRole } from "../middlewares/auth.js"


const authorsRouter =  Router()


authorsRouter.get("/",requireAuth,getAuthorsController)
authorsRouter.get("/:id",requireAuth,getAuthorByIdController)

authorsRouter.post("/",requireAuth,requireRole(["LIBRARIAN"]),addAuthorController)
authorsRouter.delete("/:id",requireAuth,requireRole(["LIBRARIAN"]),deleteAuthorController)

authorsRouter.patch("/:id",requireAuth,requireRole(["LIBRARIAN"]),removeUndefinedMiddleware(UpdateAuthor),updateAuthorController)


export default authorsRouter