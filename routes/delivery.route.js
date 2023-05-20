import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect, auth } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import deliveryController from '../controllers/delivery.controller.js';

const deliveryRouter = express.Router();

deliveryRouter.get('/address/province', asyncHandler(deliveryController.getProvince));
deliveryRouter.get('/address/:id/district', asyncHandler(deliveryController.getDistrict));
deliveryRouter.get('/address/:id/ward', asyncHandler(deliveryController.getWard));
deliveryRouter.get(
    '/shipping-order/:id/print/:pageSize',
    protect,
    auth('staff', 'admin'),
    asyncHandler(deliveryController.printOrder),
);
deliveryRouter.post('/shipping-order/fee', validate.calculateFee, asyncHandler(deliveryController.calculateFee));
deliveryRouter.post('/shipping-order/services', validate.services, asyncHandler(deliveryController.services));
deliveryRouter.post(
    '/shipping-order/lead-time',
    validate.estimatedDeliveryTime,
    asyncHandler(deliveryController.estimatedDeliveryTime),
);
deliveryRouter.post(
    '/shipping-order/:id/preview',
    protect,
    auth('staff', 'admin'),
    asyncHandler(deliveryController.preview),
);
deliveryRouter.post(
    '/shipping-order/:id/preview',
    protect,
    auth('staff', 'admin'),
    asyncHandler(deliveryController.preview),
);
deliveryRouter.post(
    '/shipping-order/:id/update-cod',
    validate.updateCOD,
    protect,
    auth('staff', 'admin'),
    asyncHandler(deliveryController.updateCOD),
);
export default deliveryRouter;
