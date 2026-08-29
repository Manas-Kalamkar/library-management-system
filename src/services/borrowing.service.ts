import { Prisma } from "../generated/prisma/client.js";
import type { RemoveUndefinedType } from "../middlewares/removeUndefined.js";
import { addBorrowing, deleteBorrowing, getBorrowingById, getBorrowings, updateBorrowing } from "../repositories/borrowing.repository.js"
import type { BorrowingQuerySchemaType, CreateBorrowingType, UpdateBorrowingType } from "../schemas/borrowing.schema.js";
import { AppError } from "../utils/AppError.js";



export const getBorrowingsService = async (query: BorrowingQuerySchemaType) => {
    const borrowings = await getBorrowings(query);
    if (!borrowings.length) throw new AppError("Borrowings Not Found", 404)
    return borrowings;
}


export const getBorrowingByIdService = async (id: string) => {
    const borrowing = await getBorrowingById(id);
    if (!borrowing) throw new AppError("Borrowings Not Found", 404)
    return borrowing;
}

// adding multiple borrowings in a array
// export const addBorrowingsService = async (
//     data: CreateBorrowingType[]
// ) => {
//     const borrowings: Prisma.BorrowingCreateManyInput[] = data.map((item) => (
//         {
//             borrowingId: item.borrowingId,
//             borrowerId: item.borrowerId,
//             librarianId: item.librarianId,
//             borrowedAt: item.borrowedAt,
//             dueDate:item.dueDate?? new Date(item.borrowedAt.getDate() + 7 * 24 * 60 * 60 * 1000),
//             returnedAt: item.returnedAt ?? null,
//         }
//     ))

//     return addBorrowing(borrowings);
// };


export const addBorrowingsService = async (
    data: CreateBorrowingType
) => {

    try{

        let dueDate = data.dueDate ?? new Date(data.borrowedAt.getDate() + 7 )    
        const newData = {
            bookId: data.bookId,
            librarianId: data.librarianId,
            borrowerId: data.borrowerId,
            borrowedAt: data.borrowedAt,
            dueDate: dueDate,
            returnedAt: data.returnedAt ?? null
        }
        const borrowing = await addBorrowing(newData);
    
        return borrowing
    }catch(error){
        if(error instanceof Prisma.PrismaClientKnownRequestError){
            if(error.code === "P2002") throw new AppError("Borrowing already exists",409)
        }
    }
};


export const updateBorrowingService = async (id: string, data: RemoveUndefinedType<UpdateBorrowingType>) => {
    try{
        const borrowing = await updateBorrowing(id, data);
        return borrowing;
    }catch(error){
        if(error instanceof Prisma.PrismaClientKnownRequestError){
            if(error.code === "P2002") throw new AppError("Borrowing already exists",409)
            if(error.code === "P2025") throw new AppError("Borrowing not found",404)
        }
    }
}


export const deleteBorrowingsService = async (id: string) => {
    try{
        const borrowing = await deleteBorrowing(id);
        return borrowing;
    }catch(error){
        if(error instanceof Prisma.PrismaClientKnownRequestError){
            
            if(error.code === "P2003") throw new AppError("Borrowing cannot be deleted because related records exits",409)
            if(error.code === "P2025") throw new AppError("Borrowing not found",404)
        }
    }
}