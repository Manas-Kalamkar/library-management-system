import { Router } from "express"
import { getAuthorsController, getAuthorsByIdController,addAuthorController,deleteAuthorController } from "../controllers/author.controller.js"


const authorsRouter =  Router()


authorsRouter.get("/",getAuthorsController)
authorsRouter.get("/:id",getAuthorsByIdController)
authorsRouter.post("/",addAuthorController)
authorsRouter.patch("/:id",addAuthorController)
authorsRouter.delete("/:id",deleteAuthorController)


export default authorsRouter