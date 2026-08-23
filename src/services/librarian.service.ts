import prisma from "../config/prisma.js"
import type { RemoveUndefinedType } from "../middlewares/removeUndefined.js";
import { addLibrarian, getLibrarians, getLibrarianById, deleteLibrarian,updateLibrarian } from "../repositories/librarian.repository.js";
import type { CreateLibrarianType, LibrarianQuerySchemaType, UpdateLibrarianType } from "../schemas/librarian.schema.js";






export const getLibrariansService = async (query:LibrarianQuerySchemaType) => {
    const Librarians = await getLibrarians(query);
    return Librarians
}


export const getLibrarianByIdService = async (id: string) => {
    const Librarians = await getLibrarianById(id);
    return Librarians
}

export const addLibrarianService = async (data: CreateLibrarianType) => {
    const Librarian = await addLibrarian(data)
    return Librarian;
}


export const deleteLibrarianService = async (id: string) => {
    const Librarians = await deleteLibrarian(id);
    return Librarians
}


export const updateLibrarianService = async (id:string, data:RemoveUndefinedType<UpdateLibrarianType>) =>{
    const updatedLibrarian = await updateLibrarian(id,data);

    return updatedLibrarian


}