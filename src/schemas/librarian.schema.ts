import * as z from 'zod'



export const CreateLibrarian = z.object({
  name: z.string(),
  email: z.email(),
  salary: z.int(),
  joiningYear: z.int()
})

export type CreateLibrarianType = z.infer<typeof CreateLibrarian>



export const UpdateLibrarian = CreateLibrarian.partial()


export type UpdateLibrarianType = z.infer<typeof UpdateLibrarian>


export const LibrarianQuerySchema = z.object({
  search: z.coerce.string().optional(),
  joiningYear: z.coerce.number().int().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().max(8).default(4),
  sort: z.enum(["name", "salary", "joiningYear"]).default('joiningYear'),
  order: z.enum(["asc", "desc"]).default("desc")
})

export type LibrarianQuerySchemaType = z.infer<typeof LibrarianQuerySchema>
