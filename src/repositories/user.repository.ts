import prisma from "../config/prisma.js"
import type { LoginDataType, SignupDataType } from "../schemas/user.schema.js"


export const addUser = async (data: SignupDataType) => {
    return await prisma.user.create({
        data
    })
}

export const findUser = async ({ email, password }: LoginDataType) => {
    return await prisma.user.findUnique({
        where: {
            email,
            password
        }
    })
}
export const findUserByEmail = async (email: string) => {
    return await prisma.user.findUnique({
        where: {
            email
        }
    })
}

export const findUserById = async (id: string) => {
    return await prisma.user.findUnique({
        where: {
            id
        }
    })
}



export const deleteUser = async ({ email, password }: LoginDataType) => {
    return await prisma.user.delete({
        where: {
            email,
            password
        }
    })
}
 