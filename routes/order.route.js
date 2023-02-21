import express from 'express';
import asyncHandler from 'express-async-handler';
import { auth, protect } from '../middleware/auth.middleware.js';
import orderController from '../controllers/order.controller.js';

const orderRouter = express.Router();

orderRouter.post('/', protect, auth('user'), asyncHandler(orderController.placeOrder));
orderRouter.get('/all', protect, auth('admin'), asyncHandler(orderController.getOrders));
orderRouter.get('/:id', protect, auth('user', 'admin'), asyncHandler(orderController.getOrderById));
orderRouter.get('/', protect, auth('user'), asyncHandler(orderController.getOrdersByUserId));
orderRouter.patch('/:id', protect, auth('user', 'admin'), asyncHandler(orderController.updateOrderStatus));
orderRouter.patch('/:id/cancel', protect, auth('user', 'admin'), asyncHandler(orderController.cancelOrder));
orderRouter.post(
    '/:id/orderItem/:orderItemId/product/:productId',
    protect,
    auth('user'),
    asyncHandler(orderController.reviewProductByOrderItemId),
);

// orderRouter.get(
//   "/productbestseller",
//   protect,
//   asyncHandler(async (req, res) => {
//     const orders = await Order.find({})
//     const products = await Product.find({}).sort({ _id: -1 });
//     let AllOrder = [];
//     let Arr = {};
//     let ArrQuatity = [];
//     for (let order of orders) {
//       for (let ordr of order.orderItems) {
//         AllOrder.push(ordr)
//       }
//     }
//     for(let i = 0 ;i<AllOrder.length - 1;i++) {
//         if (Arr[AllOrder[i].name]!= undefined) Arr[AllOrder[i].name]++
//         else Arr[AllOrder[i].name] = 1
//     }
//     let newarr = []
//     ArrQuatity = Object.entries(Arr).sort(function(a, b){return b[1] - a[1]})
//     for(let i = 0; i<ArrQuatity.length; i++) {
//       for(let j = 0; j< products.length; j++) {
//               if(ArrQuatity[i][0] === products[j].name) {
//               newarr.push(products[j])
//               break

//               }
//       }
//     }
//     res.json(newarr);
//     })
// );

// USER LOGIN ORDERS
//orderRouter.get('/', protect, asyncHandler(orderController.getOrders));

// ORDER IS PAID
//orderRouter.put('/:id/pay', protect, asyncHandler(orderController.confirmOrderIsPaid));

// ORDER IS DELIVERED
//orderRouter.put('/:id/delivered', protect, asyncHandler(orderController.confirmOrderIsDelivered));

//orderRouter.delete('/:id/cancel', protect, admin, asyncHandler(orderController.cancelOrderByAdmin));
//orderRouter.delete('/:id/ucancel', protect, asyncHandler(orderController.uncancel));
//Duplicated
// orderRouter.put(
//     '/:id/paid',
//     protect,
//     asyncHandler(async (req, res) => {
//         const order = await Order.findById(req.params.id);

//         if (order) {
//             order.isPaid = true;
//             order.deliveredAt = Date.now();

//             const updatedOrder = await order.save();
//             res.json(updatedOrder);
//         } else {
//             res.status(404);
//             throw new Error('Order Not Found');
//         }
//     }),
// );

export default orderRouter;
