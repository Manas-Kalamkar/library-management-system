import express, { type Express } from "express";
import cors from 'cors';
import booksRouter from "./routes/book.route.js";
import authorsRouter from "./routes/author.route.js";
import librarianRouter from "./routes/librarian.route.js";
import borrowerRouter from "./routes/borrower.route.js";
import borrowingRouter from "./routes/borrowing.route.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import type { Request, Response } from "express";
import { AppError } from "./utils/AppError.js";

const app: Express = express();
app.use(express.json());
app.use(cors());



app.use('/books', booksRouter)
app.use('/authors', authorsRouter)
app.use('/librarians', librarianRouter)
app.use('/borrowers', borrowerRouter)
app.use('/borrowings', borrowingRouter)

app.use((req: Request, res: Response) => {
    throw new AppError("Route Not Found", 404)
})

app.use(errorHandler);

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception: ", err.message)
    process.exit(1)
})

process.on("unhandledRejection", (err:Error) => {
    console.log("Uncaught Rejection:", err.message)
    process.exit(1)
})

export default app;