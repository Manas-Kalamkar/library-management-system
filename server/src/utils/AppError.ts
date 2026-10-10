export class AppError extends Error {
    public statusCode: number;
    public code?: string | undefined;

    constructor(message: string, statusCode: number, code?:string) {
        super(message);
        this.name= new.target.name;
        this.statusCode = statusCode;
        this.code = code;
    }

}