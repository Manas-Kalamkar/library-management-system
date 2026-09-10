import * as z from 'zod'

export const SignupData = z.object({
    userName: z.string(),
    email: z.email(),
    password: z.coerce.string().min(8).max(15),
    phoneNo:z.coerce.string().min(10).max(10)
})

export type SignupDataType = z.infer<typeof SignupData>

export const LoginData = z.object({
    email: z.email(),
    password: z.coerce.string()
})

export type LoginDataType = z.infer<typeof LoginData>