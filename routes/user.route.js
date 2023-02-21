import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect, auth } from '../middleware/auth.middleware.js';
import userController from '../controllers/user.controller.js';
import validate from '../middleware/validate.middleware.js';

const userRouter = express.Router();

userRouter.post('/login', validate.login, asyncHandler(userController.login));
userRouter.get('/profile', protect, auth('user', 'staff', 'admin'), asyncHandler(userController.getProfile));
userRouter.put('/profile', protect, auth('user', 'staff', 'admin'), asyncHandler(userController.updateProfile));
userRouter.patch('/auth/verify-email', asyncHandler(userController.verifyEmail));
userRouter.post('/register', validate.register, asyncHandler(userController.register));
userRouter.patch(
    '/auth/change-password',
    protect,
    auth('user', 'staff', 'admin'),
    asyncHandler(userController.changePassword),
);
userRouter.patch('/auth/forgot-password', asyncHandler(userController.forgotPassword));
userRouter.patch('/auth/reset-password', validate.resetPassword, asyncHandler(userController.resetPassword));
userRouter.patch('/auth/cancel-verify-email', asyncHandler(userController.cancelVerifyEmail));
userRouter.patch('/auth/cancel-reset-password', asyncHandler(userController.cancelResetPassword));
userRouter.get('/', protect, auth('staff', 'admin'), asyncHandler(userController.getUsersByAdmin));
export default userRouter;
