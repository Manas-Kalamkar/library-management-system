import express from "express";
import type { Express, Request, Response } from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';

import homeRouter from "./routes/home.route.js";
import booksRouter from "./routes/book.route.js";
import authorsRouter from "./routes/author.route.js";
import librarianRouter from "./routes/librarian.route.js";
import borrowerRouter from "./routes/borrower.route.js";
import borrowingRouter from "./routes/borrowing.route.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import { AppError } from "./utils/AppError.js";
import userRouter from "./routes/user.route.js";

const app: Express = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser("helloworld"));
app.use(session({
    secret:'manas the great',
    resave:false,
    saveUninitialized:false,
    cookie:{maxAge:30000}
}))


app.use('/api/auth',userRouter)

app.use('/', homeRouter)
app.use('/api/books', booksRouter)
app.use('/api/authors', authorsRouter)
app.use('/api/librarians', librarianRouter)
app.use('/api/borrowers', borrowerRouter)
app.use('/api/borrowings', borrowingRouter)

app.use((req: Request, res: Response) => {
    throw new AppError("Route Not Found", 404)
})

app.use(errorHandler);

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception: ", err.message)
    process.exit(1)
})

process.on("unhandledRejection", (err: Error) => {
    console.log("Uncaught Rejection:", err.message)
    process.exit(1)
})

export default app;