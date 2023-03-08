import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect, auth } from '../middleware/auth.middleware.js';
import cartController from '../controllers/cart.controller.js';
import validate from '../middleware/validate.middleware.js';

const cartRouter = express.Router();

cartRouter.get('/', protect, auth('customer'), asyncHandler(cartController.getCart));
cartRouter.post('/add', validate.addProductToCart, protect, auth('customer'), asyncHandler(cartController.addToCart));
cartRouter.patch(
    '/update',
    validate.updateCartItem,
    protect,
    auth('customer'),
    asyncHandler(cartController.updateCartItem),
);
cartRouter.patch('/remove', protect, auth('customer'), asyncHandler(cartController.removeCartItems));

export default cartRouter;
