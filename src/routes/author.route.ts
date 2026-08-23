import { Router } from "express"
import { getAuthorsController, getAuthorByIdController,addAuthorController,deleteAuthorController,updateAuthorController } from "../controllers/author.controller.js"
import { removeUndefinedMiddleware } from "../middlewares/removeUndefined.js"
import { UpdateAuthor } from "../schemas/author.schema.js"


const authorsRouter =  Router()


authorsRouter.get("/",getAuthorsController)
authorsRouter.get("/:id",getAuthorByIdController)

authorsRouter.post("/",addAuthorController)
authorsRouter.delete("/:id",deleteAuthorController)

authorsRouter.patch("/:id",removeUndefinedMiddleware(UpdateAuthor),updateAuthorController)


export default authorsRouter