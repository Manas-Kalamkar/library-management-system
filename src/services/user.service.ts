import { addUser, deleteUser, findUser, findUserByEmail, findUserById } from "../repositories/user.repository.js";
import type { LoginDataType, SignupDataType } from "../schemas/user.schema.js";
import { hashPassword, comparePassword } from "../middlewares/hashPassword.js";
import { AppError } from "../utils/AppError.js";
import { Prisma } from "../generated/prisma/client.js";

export const userSignupService = async (data: SignupDataType) => {

    data.password = await hashPassword(data.password)
    try {
        const user = await addUser(data)
        return user;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {

            if (error.code === "P2002") throw new AppError(`User already exists.`, 409)
        }
    }

}

export const userLoginService = async ({ email, password }: LoginDataType) => {
    const user = await findUserByEmail(email)
    if (!user) throw new AppError("User Not Found ", 404)
    const isPasswordCorrect = await (comparePassword(password, user.password))


    if (!isPasswordCorrect) throw new AppError("Invalid Credentials ", 403)

    return {
        id: user.id,
        email: user.email,
        userName: user.userName,
        role: user.role
    };

}


export const userDeleteService = async (id:string) => {

    return await deleteUser(id);
}

export const userStatusService = async (id: string) => {
    const user = await findUserById(id);

    if (!user) throw new AppError('User not Found', 404)
    return {
        id: user.id,
        email: user.email,
        userName: user.userName
    };
}