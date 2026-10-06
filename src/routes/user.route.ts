import { Router } from "express";
import {
    userChangePasswordController,
    userDeleteController,
    userLoginController,
    userLogoutAllController,
    userLogoutController,
    userRefreshController,
    userSignupController,
    userStatusController,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { noStore, requireTrustedOrigin } from "../middlewares/originCheck.js";
import { authLimiter, loginLimiter, refreshLimiter } from "../middlewares/rateLimiter.js";

const userRouter = Router();

userRouter.use(noStore);

userRouter.post('/signup', authLimiter, userSignupController)
userRouter.post('/login', loginLimiter, userLoginController)

// These two rely on the refresh cookie, so they also verify the request Origin.
userRouter.post('/refresh', requireTrustedOrigin, refreshLimiter, userRefreshController)
userRouter.post('/logout', requireTrustedOrigin, userLogoutController)

userRouter.post('/logout-all', requireAuth, userLogoutAllController)
userRouter.post('/change-password', requireAuth, authLimiter, userChangePasswordController)

userRouter.get('/status', requireAuth, userStatusController)
userRouter.get('/me', requireAuth, userStatusController)

userRouter.delete('/:id', requireAuth, userDeleteController)

export default userRouter;
