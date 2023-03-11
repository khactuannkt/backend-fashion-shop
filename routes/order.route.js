import express from 'express';
import asyncHandler from 'express-async-handler';
import { auth, protect } from '../middleware/auth.middleware.js';
import orderController from '../controllers/order.controller.js';

const orderRouter = express.Router();

orderRouter.get('/', protect, auth('staff', 'admin'), asyncHandler(orderController.getOrders));
orderRouter.get('/:id', protect, asyncHandler(orderController.getOrderById));
orderRouter.get('/user/:userId', protect, asyncHandler(orderController.getOrdersByUserId));
orderRouter.post('/', protect, auth('customer'), asyncHandler(orderController.createOrder));
orderRouter.patch('/:id', protect, asyncHandler(orderController.updateOrderStatus));
orderRouter.patch('/:id/payment', protect, asyncHandler(orderController.orderPayment));
orderRouter.patch('/:id/cancel', protect, asyncHandler(orderController.cancelOrder));

// orderRouter.post(
//     '/:id/orderItem/:orderItemId/product/:productId',
//     protect,
//     auth('customer'),
//     asyncHandler(orderController.reviewProductByOrderItemId),
// );
export default orderRouter;
