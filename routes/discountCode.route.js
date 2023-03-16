import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect, auth } from '../middleware/auth.middleware.js';
import discountCodeController from '../controllers/discountCode.controller.js';
import validate from '../middleware/validate.middleware.js';

const discountCodeRouter = express.Router();

discountCodeRouter.get('/', asyncHandler(discountCodeController.getDiscountCode));

discountCodeRouter.get(
    '/:id',
    protect,
    auth('staff', 'admin'),
    asyncHandler(discountCodeController.getDiscountCodeById),
);
discountCodeRouter.get('/code/:code', asyncHandler(discountCodeController.getDiscountCodeByCode));
discountCodeRouter.post(
    '/',
    validate.createDiscountCode,
    protect,
    auth('staff', 'admin'),
    asyncHandler(discountCodeController.createDiscountCode),
);
discountCodeRouter.put(
    '/:id',
    validate.updateDiscountCode,
    protect,
    auth('staff', 'admin'),
    asyncHandler(discountCodeController.updateDiscountCode),
);
discountCodeRouter.delete(
    '/:id',
    protect,
    auth('staff', 'admin'),
    asyncHandler(discountCodeController.deleteDiscountCode),
);

export default discountCodeRouter;
