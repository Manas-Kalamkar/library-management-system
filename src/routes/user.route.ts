import { Router } from "express";
import { userDeleteController, userLoginController, userLogoutController, userSignupController, userStatusController } from "../controllers/user.controller.js";





const userRouter = Router();

userRouter.post('/signup', userSignupController)
userRouter.post('/login', userLoginController)
userRouter.get('/status', userStatusController)

userRouter.post('/logout', userLogoutController)

userRouter.delete('/delete', userDeleteController)



export default userRouter;