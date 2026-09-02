import { Router } from "express";
import { userDeleteController, userLoginController, userSignupController, userStatusController } from "../controllers/user.controller.js";





const userRouter = Router();

userRouter.post('/signup', userSignupController)
userRouter.post('/login', userLoginController)
userRouter.post('/status', userStatusController)

userRouter.delete('/delete', userDeleteController)



export default userRouter;