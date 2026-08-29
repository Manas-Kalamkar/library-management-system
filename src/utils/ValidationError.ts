import { AppError } from "./AppError.js";

export class ValidationError extends AppError {

    public details: unknown;

    constructor(message: string, details: unknown) {
        super(message, 400);
        this.details = details;
    }
}