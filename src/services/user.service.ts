import { addUser , deleteUser, findUser, findUserByEmail, findUserById } from "../repositories/user.repository.js";
import type { LoginDataType, SignupDataType } from "../schemas/user.schema.js";
import { hashPassword, comparePassword } from "../middlewares/hashPassword.js";
import { AppError } from "../utils/AppError.js";

export const userSignupService = async (data: SignupDataType) => {
    data.password = await hashPassword(data.password)

    return await addUser(data);
}

export const userLoginService = async ({ email, password }: LoginDataType) => {
    const user = await findUserByEmail(email)
    if (!user) throw new AppError("User Not Found ", 404)
    const isPasswordCorrect = await (comparePassword(password, user.password))


    if (!isPasswordCorrect) throw new AppError("Password Incorrect", 403)

    return user;

}
 

export const userDeleteService = async (data: LoginDataType) => {

    return await deleteUser(data);
}

export const userStatusService = async (id: string) => {
    const user = await findUserById(id);
    return user;

}