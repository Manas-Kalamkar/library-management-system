import type { Request, Response } from "express";
import { LoginData, SignupData, type LoginDataType, type SignupDataType } from "../schemas/user.schema.js";
import { userDeleteService, userLoginService, userSignupService, userStatusService } from "../services/user.service.js"
import { ValidationError } from "../utils/ValidationError.js";
import { AppError } from "../utils/AppError.js";
import { findUser, findUserById } from "../repositories/user.repository.js";

export const userSignupController = async (req: Request, res: Response) => {
    const data = SignupData.safeParse(req.body);

    if (!data.success) throw new ValidationError(data.error.message, data.error.issues)
    const user = await userSignupService(data.data);

    return res.status(201).send(user);

}

export const userLoginController = async (req: Request, res: Response) => {
    const data = LoginData.safeParse(req.body);


    if (!data.success) throw new ValidationError(data.error.message, data.error.issues)
    const user = await userLoginService(data.data);
    if (!user) throw new AppError("Unauthorized: Invalid email or password", 401)

    req.session.userId = user.id

    return res.status(200).send(user);
}

export const userDeleteController = async (req: Request, res: Response) => {
    const data = LoginData.safeParse(req.body);

    if (!data.success) throw new ValidationError(data.error.message, data.error.issues)
    const user = await userDeleteService(data.data);

    return res.status(204).send(user);
}
export const userStatusController = async (req: Request, res: Response) => {
    if (!req.session.userId) throw new AppError("Not Authenticated", 401)

    const user = await userStatusService(req.session.userId)
    if (!user) throw new AppError("User No Longer Exists", 401)

    return res.status(200).send(user)

}