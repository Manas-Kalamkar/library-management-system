import * as z from 'zod'
import { EmailSchema, NameSchema, PasswordSchema } from './common.schema.js'

const PhoneSchema = z.coerce.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits")

export const CreateBorrower = z.object({
  name: NameSchema,
  email: EmailSchema,
  password: PasswordSchema,
  joiningDate: z.coerce.date().optional(),
  phoneNo: PhoneSchema
})

export type CreateBorrowerType = z.infer<typeof CreateBorrower>


export const UpdateBorrower = CreateBorrower.partial()


export type UpdateBorrowerType = z.infer<typeof UpdateBorrower>

export const BorrowerQuerySchema = z.object({
  search: z.coerce.string().trim().max(100).optional(),
  joiningDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(8).default(4),
  sort: z.enum(["name", "joiningDate"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc")
})

export type BorrowerQuerySchemaType = z.infer<typeof BorrowerQuerySchema>