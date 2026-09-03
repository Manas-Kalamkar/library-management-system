import { Router,type Request,type Response } from "express";
import 'express-session';

const homeRouter = Router();

homeRouter.use('/home',(req:Request,res:Response) => {
    console.log(req.session.id)
    console.log(req.session)
    console.log(req.sessionStore)
    req.session.visited = true;
    res.status(200).send(`
        <h1>
            Welcome To City Library
        </h1>
        <a href="/api/authors">Authors</a>
        <a href="/api/books">Books</a>
        <a href="/api/borrowers">Borrowers</a>
        <a href="/api/borrowings">Borrowings</a>
        <a href="/api/librarians">Librarians</a>
        <a href="/api/auth/signup">Signup</a>
        <a href="/api/auth/login">Login</a>
        `)
})

export default homeRouter;