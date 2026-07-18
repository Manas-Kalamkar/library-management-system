import { Router } from "express"
import { addBook, borrowBook, deleteBook, getBooks, getBooksById, updateBook } from "../controllers/book.controller.js";

const router = Router();


router.get("/books", getBooks)
router.post("/books", addBook)

router.get("/books/:id", getBooksById)
router.patch("/books/:id", updateBook)
router.delete("/books/:id", deleteBook)

//borrow
router.post("/books/:id/borrow",borrowBook)

export default router;