import prisma from "../config/prisma.js";
import type { CreateAuthor } from "../types.js";

export const getAuthors = () => {
    return  prisma.author.findMany()
}
export const getAuthorById = (id:string) => {
    return  prisma.author.findMany({
        where:{
            id
        }
    })
}
export const addAuthor = (data:CreateAuthor) => {
    return prisma.author.create({
        data
    })
}


export const deleteAuthor = (id:string) => {
    return prisma.author.delete({
        where:{id}
    })
}