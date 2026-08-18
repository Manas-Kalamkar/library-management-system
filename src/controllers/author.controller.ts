import { type Request,type Response } from "express";
import { getAuthorsService,addAuthorService, getAuthorByIdService, deleteAuthorService } from "../services/author.service.js";
import * as z from 'zod'


export const getAuthorsController = async (_:Request,res: Response) => {
    const authors = await getAuthorsService();
    if(authors){
        return res.status(200).send(authors)
    }
    return res.status(404).json({error:"No author found"})
}

const CreateAuthorValidationSchema = z.object({
    name: z.string(),
    birthYear : z.number()
})

export const getAuthorsByIdController = async (req:Request,res: Response) => {
    const id = String (req.params.id);


    const authors = await getAuthorByIdService(id);
    if(authors){
        return res.status(200).send(authors)
    }
    return res.status(404).json({error:"No author found"})
}


export const addAuthorController = (req:Request,res:Response) => {
    const result = CreateAuthorValidationSchema.safeParse(req.body)
    if(!result.success) return res.status(400).send("Invalid Author Data")

        try{
            addAuthorService(result.data)
            res.status(201).send("Author added")
        } catch (e) {
            return res.status(400).send(e)
        }

}
export const deleteAuthorController = async (req:Request,res:Response) => {
    const id = String(req.params.id)
        try{
            const deletedUser =await deleteAuthorService(id)
            return res.status(200).json({deletedUser : deletedUser})
        } catch (e) {
            return res.status(400).send(e)
        }

}