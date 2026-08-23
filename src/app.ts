import express, { type Express } from "express";
import cors from 'cors';
import booksRouter from "./routes/book.route.js";
import authorsRouter from "./routes/author.route.js";
import librarianRouter from "./routes/librarian.route.js";
import borrowerRouter from "./routes/borrower.route.js";

const app: Express = express();
app.use(express.json());
app.use(cors());



app.use('/books', booksRouter)
app.use('/authors', authorsRouter)
app.use('/librarians', librarianRouter)
app.use('/borrowers', borrowerRouter)


export default app;