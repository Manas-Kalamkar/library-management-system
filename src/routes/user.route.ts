import { Router } from "express";
import { userDeleteController, userLoginController, userLogoutController, userSignupController, userStatusController } from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";





const userRouter = Router();

userRouter.post('/signup', userSignupController)
userRouter.post('/login', userLoginController)
userRouter.get('/status', requireAuth, userStatusController)

userRouter.post('/logout', requireAuth, userLogoutController)

userRouter.delete('/:id', requireAuth, requireRole(["ADMIN", "LIBRARIAN"]), userDeleteController)



export default userRouter;