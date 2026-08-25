import z from 'zod'


export const CreateBorrowing = z.object({
    bookId: z.coerce.string(),
    borrowerId: z.coerce.string(),
    librarianId: z.coerce.string(),

    borrowedAt: z.coerce.date().default(() => new Date()),
    dueDate: z.coerce.date().optional(),
    returnedAt: z.coerce.date().nullable().optional()
})

export type CreateBorrowingType = z.infer<typeof CreateBorrowing>


export const UpdateBorrowing = CreateBorrowing.partial()

export type UpdateBorrowingType = z.infer<typeof UpdateBorrowing>

export const BorrowingQuerySchema = z.object({
    search:z.coerce.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().max(10).default(10),
    sort: z.enum(["borrowedAt"]).default("borrowedAt"),
    order: z.enum(["asc", "desc"]).default("desc"),
})

export type BorrowingQuerySchemaType = z.infer<typeof BorrowingQuerySchema>