import * as z from 'zod'
import { EmailSchema, NameSchema, PasswordSchema } from './common.schema.js'


export const CreateLibrarian = z.object({
  name: NameSchema,
  salary: z.int().min(0),
  email: EmailSchema,
  joiningYear: z.int().min(1900).max(new Date().getFullYear() + 1),
  password: PasswordSchema,
})

export type CreateLibrarianType = z.infer<typeof CreateLibrarian>


export const UpdateLibrarian = CreateLibrarian.partial()


export type UpdateLibrarianType = z.infer<typeof UpdateLibrarian>


export const LibrarianQuerySchema = z.object({
  search: z.coerce.string().trim().max(100).optional(),
  joiningYear: z.coerce.number().int().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(8).default(4),
  sort: z.enum(["name", "salary", "joiningYear"]).default('joiningYear'),
  order: z.enum(["asc", "desc"]).default("desc")
})

export type LibrarianQuerySchemaType = z.infer<typeof LibrarianQuerySchema>
