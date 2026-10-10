import { Router } from "express"
import { addBookController, deleteBookController, getBooksByIdController, getBooksController, updateBookController } from "../controllers/book.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const booksRouter = Router();

booksRouter.get("/", requireAuth, getBooksController)
booksRouter.get("/:id",requireAuth, getBooksByIdController)

booksRouter.post("/",requireAuth,requireRole(["LIBRARIAN","ADMIN"]), addBookController)
booksRouter.patch("/:id",requireAuth,requireRole(["LIBRARIAN","ADMIN"]), updateBookController)
booksRouter.delete("/:id", requireAuth,requireRole(["LIBRARIAN","ADMIN"]),deleteBookController)

export default booksRouter;