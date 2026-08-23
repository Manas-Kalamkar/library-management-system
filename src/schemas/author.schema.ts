import * as z from 'zod'


export interface Author {
  id: string
  name: string
  birthYear: number
}


export const CreateAuthor= z.object({
  name: z.string(),
  birthYear: z.number()
})

export type CreateAuthorType = z.infer<typeof CreateAuthor>


export const UpdateAuthor= CreateAuthor.partial()


export type UpdateAuthorType = z.infer<typeof UpdateAuthor>


export const AuthorQuerySchema = z.object({
  search:z.coerce.string().trim().optional(),
  name:z.coerce.string().trim().optional(),
  birthYear:z.coerce.number().int().max(new Date().getFullYear()).optional(),
  page:z.coerce.number().int().min(1).default(1),
  limit:z.coerce.number().int().max(5).default(4),
  sort : z.enum(["name","birthYear"]).default("name"),
  order : z.enum(["asc","desc"]).default("asc"),
})

export type AuthorQuerySchemaType = z.infer<typeof AuthorQuerySchema>