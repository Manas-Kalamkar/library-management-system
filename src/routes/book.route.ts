import { Router } from "express"
import { addBookController, deleteBookController, getBooksByIdController, getBooksController, updateBookController } from "../controllers/book.controller.js";
import { removeUndefinedMiddleware } from "../middlewares/removeUndefined.js";
import { UpdateBook } from "../schemas/book.schema.js";

const booksRouter = Router();

booksRouter.get("/", getBooksController)
booksRouter.post("/", addBookController)


booksRouter.get("/:id", getBooksByIdController)
booksRouter.patch("/:id", removeUndefinedMiddleware(UpdateBook), updateBookController)
booksRouter.delete("/:id", deleteBookController)

export default booksRouter;