import * as z from 'zod'
import { IdSchema } from './common.schema.js'

export const CreateBook = z.object({
    title: z.string().trim().min(1).max(255),
    genre: z.string().trim().min(1).max(100),
    publishedYear: z.number().int().min(0).max(new Date().getFullYear()),
    available: z.boolean(),
    authorId: IdSchema
})

export type CreateBookType = z.infer<typeof CreateBook>


export const UpdateBook = CreateBook.partial();

export type UpdateBookType = z.infer<typeof UpdateBook>

export const BookQuerySchema = z.object({
    search: z.coerce.string().trim().max(100).optional(),
    genre: z.coerce.string().trim().max(100).optional(),
    publishedYear: z.coerce.number().int().optional(),
    available: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
    page: z.coerce.number().int().min(1).max(20).default(1),
    limit: z.coerce.number().int().min(1).max(8).default(4),
    sort: z.enum(["title", "genre", "publishedYear"]).default('publishedYear'),
    order: z.enum(["asc", "desc"]).default("desc")
})

export type BookQuerySchemaType = z.infer<typeof BookQuerySchema>
