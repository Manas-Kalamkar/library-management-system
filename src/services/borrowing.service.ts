import type { RemoveUndefinedType } from "../middlewares/removeUndefined.js";
import { addBorrowing, deleteBorrowing, getBorrowingById, getBorrowings, updateBorrowing } from "../repositories/borrowing.repository.js"
import type { BorrowingQuerySchemaType, CreateBorrowingType, UpdateBorrowingType } from "../schemas/borrowing.schema.js";



export const getBorrowingsService = async (query:BorrowingQuerySchemaType) => {
    const books = await getBorrowings(query);
    return books;
}


export const getBorrowingByIdService = async (id: string) => {
    const books = await getBorrowingById(id);
    return books;
}

// adding multiple borrowings in a array
// export const addBorrowingsService = async (
//     data: CreateBorrowingType[]
// ) => {
//     const borrowings: Prisma.BorrowingCreateManyInput[] = data.map((item) => (
//         {
//             bookId: item.bookId,
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
    let dueDate = data.dueDate ?? new Date(data.borrowedAt.getTime() + 7 * 24 * 60 * 60 * 1000)

    const newData  = {
        bookId: data.bookId,
        librarianId: data.librarianId,
        borrowerId : data.borrowerId,
        borrowedAt : data.borrowedAt,
        dueDate:dueDate,
        returnedAt:data.returnedAt ?? null
    }
    const borrowing = await addBorrowing(newData);

    return borrowing
};


export const updateBorrowingService = async (id: string, data: RemoveUndefinedType<UpdateBorrowingType>) => {
    const book = await updateBorrowing(id, data);
    return book;
}


export const deleteBorrowingsService = async (id: string) => {
    const book = await deleteBorrowing(id);
    return book;
}