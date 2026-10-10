import z from 'zod'
import { IdSchema } from './common.schema.js'

export const CreateBorrowing = z.object({
    bookId: IdSchema,
    borrowerId: IdSchema,
    librarianId: IdSchema.optional(),

    borrowedAt: z.coerce.date().default(() => new Date()),
    dueDate: z.coerce.date().optional(),
    returnedAt: z.coerce.date().nullable().optional()
})

export type CreateBorrowingType = z.infer<typeof CreateBorrowing>


export const UpdateBorrowing = z.object({
    dueDate: z.coerce.date().optional(),
    returnedAt: z.coerce.date().nullable().optional(),
})

export type UpdateBorrowingType = z.infer<typeof UpdateBorrowing>

export const BorrowingQuerySchema = z.object({
    search: z.coerce.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(10).default(10),
    sort: z.enum(["borrowedAt"]).default("borrowedAt"),
    order: z.enum(["asc", "desc"]).default("desc"),
})

export type BorrowingQuerySchemaType = z.infer<typeof BorrowingQuerySchema>
