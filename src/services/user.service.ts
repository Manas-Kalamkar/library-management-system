import { addUser, deleteUser, findUser, findUserById } from "../repositories/user.repository.js";
import type { LoginDataType, SignupDataType } from "../schemas/user.schema.js";


export const userSignupService = async (data: SignupDataType) => {

    return await addUser(data);
}

export const userLoginService = async (data: LoginDataType) => {
    return await findUser(data);
}
export const userDeleteService = async (data: LoginDataType) => {

    return await deleteUser(data);
}

export const userStatusService = async (id:string) => {
    const user =  await findUserById(id);
    return user;

}