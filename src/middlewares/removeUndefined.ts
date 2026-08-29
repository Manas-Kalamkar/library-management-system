import type { Request, Response, NextFunction } from "express"
import { UpdateLibrarian } from "../schemas/librarian.schema.js"
import { object, type ZodType } from "zod"
import { ValidationError } from "../utils/ValidationError.js"

export type RemoveUndefinedType<T> = {
    [K in keyof T]?: Exclude<T[K], undefined>
}



export const removeUndefined = <T extends object>(data: T) => {
    return Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
    ) as RemoveUndefinedType<T>
}


export const removeUndefinedMiddleware = (schema: ZodType) => {


    return (req: Request, res: Response, next: NextFunction) => {

        const data = schema.safeParse(req.body)

        if (!data.success) throw new ValidationError("Invalid Data",data.error.issues)


        req.body = removeUndefined(data.data as object)
        
        next();

    }
}