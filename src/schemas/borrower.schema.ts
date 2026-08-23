import * as z from 'zod'



export const CreateBorrower = z.object({
  name: z.string(),
  email: z.email(),
  joiningDate: z.coerce.date(),
  phoneNo: z.coerce.string()
})

export type CreateBorrowerType = z.infer<typeof CreateBorrower>


export const UpdateBorrower = CreateBorrower.partial()


export type UpdateBorrowerType = z.infer<typeof UpdateBorrower>

export const BorrowerQuerySchema = z.object({
  search: z.coerce.string().optional(),
  joiningDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().max(8).default(4),
  sort: z.enum(["name", "joiningDate"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc")
})

export type BorrowerQuerySchemaType = z.infer<typeof BorrowerQuerySchema>