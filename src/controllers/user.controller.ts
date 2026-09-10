import type { Request, Response } from "express";
import { LoginData, SignupData } from "../schemas/user.schema.js";
import { userDeleteService, userLoginService, userSignupService, userStatusService } from "../services/user.service.js"
import { ValidationError } from "../utils/ValidationError.js";
import { AppError } from "../utils/AppError.js";


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
    req.session.role = user.role


    return res.status(200).send(user);
}

export const userDeleteController = async (req: Request, res: Response) => {
    const id = String(req.params.id)
    console.log("id",id)
    const user = await userDeleteService(id);

    return res.status(204).send(user);
}
export const userStatusController = async (req: Request, res: Response) => {
    if (!req.session.userId) throw new AppError("Not Authenticated", 401)

    const user = await userStatusService(req.session.userId)
    if (!user) throw new AppError("User No Longer Exists", 401)

    return res.status(200).send(user)

}
export const userLogoutController = async (req: Request, res: Response) => {

    if (!req.session.userId) throw new AppError("Unauthenticate User", 401)

    req.session.destroy((err) => {

        if (err) {
            console.log("Session Error: ", err)
            throw new AppError("Could not log out", 500)
        }
        res.clearCookie("connect.sid")

        return res.status(200).send("User Logged Out")
    })




}