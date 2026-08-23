import * as z from 'zod'

export const CreateBook = z.object({
    title: z.string(),
    genre: z.string(),
    publishedYear: z.number(),
    available: z.boolean(),
    authorId: z.string()
})

export type CreateBookType = z.infer<typeof CreateBook>


export const UpdateBook = CreateBook.partial();

export type UpdateBookType = z.infer<typeof UpdateBook>

export const BookQuerySchema = z.object({
    search: z.coerce.string().optional(),
    genre: z.coerce.string().optional(),
    publishedYear: z.coerce.number().int().optional(),
    available: z.enum(["true","false"]).transform((value)=>value === "true").optional(),
    page: z.coerce.number().int().min(1).max(20).default(1),
    limit: z.coerce.number().int().max(8).default(4),
    sort:z.enum(["title","genre","publishedYear"]).default('publishedYear'),
    order:z.enum(["asc","desc"]).default("desc")
})

export type BookQuerySchemaType = z.infer<typeof BookQuerySchema>
