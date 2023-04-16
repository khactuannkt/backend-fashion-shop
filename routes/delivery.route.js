import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect, auth } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import deliveryController from '../controllers/delivery.controller.js';

const deliveryRouter = express.Router();

deliveryRouter.get('/address/province', asyncHandler(deliveryController.getProvince));
deliveryRouter.get('/address/district', validate.getDistrict, asyncHandler(deliveryController.getDistrict));
deliveryRouter.get('/address/ward', validate.getWard, asyncHandler(deliveryController.getWard));
deliveryRouter.get('/shipping-order/fee', validate.calculateFee, asyncHandler(deliveryController.calculateFee));
deliveryRouter.get(
    '/shipping-order/lead-time',
    validate.estimatedDeliveryTime,
    asyncHandler(deliveryController.estimatedDeliveryTime),
);
// deliveryRouter.get(
//     '/shipping-order/create',
//     validate.createShippingOrder,
//     asyncHandler(deliveryController.createShippingOrder),
// );

export default deliveryRouter;
