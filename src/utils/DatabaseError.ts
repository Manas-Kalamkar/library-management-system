import { AppError } from "./AppError.js";

export class DatabaseError extends AppError{
    public details:unknown;
    constructor(message:string,details:unknown){
        super(message,503);
        this.details = details;
    }
}