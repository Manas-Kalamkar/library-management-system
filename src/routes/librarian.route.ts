import { Router } from "express"
import { getLibrariansController, getLibrarianByIdController, addLibrarianController, deleteLibrarianController, updateLibrarianController } from "../controllers/librarian.controller.js"
import { removeUndefined, removeUndefinedMiddleware } from "../middlewares/removeUndefined.js"
import { UpdateLibrarian } from "../schemas/librarian.schema.js"


const librarianRouter = Router()


librarianRouter.get("/", getLibrariansController)
librarianRouter.get("/:id", getLibrarianByIdController)
librarianRouter.post("/", addLibrarianController)
librarianRouter.delete("/:id", deleteLibrarianController)

librarianRouter.patch("/:id", removeUndefinedMiddleware(UpdateLibrarian), updateLibrarianController)


export default librarianRouter