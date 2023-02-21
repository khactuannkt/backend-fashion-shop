import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect, auth } from '../middleware/auth.middleware.js';
import cartController from '../controllers/cart.controller.js';

const cartRouter = express.Router();

cartRouter.post('/add', protect, auth('user'), asyncHandler(cartController.addToCart));
cartRouter.patch('/update', protect, auth('user'), asyncHandler(cartController.updateCartItem));
cartRouter.patch('/remove', protect, auth('user'), asyncHandler(cartController.removeCartItems));
cartRouter.get('/', protect, auth('user'), asyncHandler(cartController.getCart));

export default cartRouter;
