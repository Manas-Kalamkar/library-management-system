import { Router } from "express"
import { addBookController, deleteBookController, getBooksByIdController, getBooksController, updateBookController } from "../controllers/book.controller.js";
import { removeUndefinedMiddleware } from "../middlewares/removeUndefined.js";
import { UpdateBook } from "../schemas/book.schema.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const booksRouter = Router();

booksRouter.get("/", requireAuth, getBooksController)
booksRouter.post("/",requireAuth,requireRole(["LIBRARIAN"]), addBookController)


booksRouter.get("/:id",requireAuth, getBooksByIdController)
booksRouter.patch("/:id",requireAuth,requireRole(["LIBRARIAN"]), removeUndefinedMiddleware(UpdateBook), updateBookController)
booksRouter.delete("/:id", requireAuth,requireRole(["LIBRARIAN"]),deleteBookController)

export default booksRouter;