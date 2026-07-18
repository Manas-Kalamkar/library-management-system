import express, { type Express } from "express";
import cors from 'cors';
import router from "./routes/book.route.js";

const app: Express = express();

app.use(express.json());
app.use(cors());

app.use('/', router)


export default app;