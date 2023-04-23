import mongoose from 'mongoose';
import schedule, { scheduleJob } from 'node-schedule';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';
import Variant from '../models/variant.model.js';
import Cart from '../models/cart.model.js';
import DiscountCode from '../models/discountCode.model.js';
import { orderQueryParams, validateConstants } from '../utils/searchConstants.js';
import { validationResult } from 'express-validator';
import createRequestBody from '../utils/payment-with-momo.js';
import axios from 'axios';
import Payment from '../models/payment.model.js';
import { v4 as uuidv4 } from 'uuid';
import { momo_Request } from '../utils/request.js';

const getOrdersByUserId = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
        if (req.user._id != req.params.userId) {
            return res
                .status(403)
                .json({ message: 'Bị cấm. Bạn không thể truy cập thông tin đơn hàng của người khác.' });
        }
    }
    const limit = Number(req.query.limit) || 20; //EDIT HERE
    const page = Number(req.query.page) || 0;
    const status = String(req.query.status) || null;
    const orderFilter = { user: req.user._id };
    if (status) {
        orderFilter.status = status;
    }
    const count = await Order.countDocuments({ ...orderFilter });
    const orders = await Order.find({ ...orderFilter })
        .limit(limit)
        .skip(limit * page)
        .sort({ createdAt: 'desc' });
    res.status(200).json({ data: { orders, page, pages: Math.ceil(count / limit), total: count } });
};

const getOrderById = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
        res.status(404);
        throw new Error('Đơn hàng không tồn tại');
    }
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
        if (req.user._id.toString() !== order.user.toString()) {
            res.status(404);
            throw new Error('Đơn hàng không tồn tại');
        }
    }
    res.status(200).json({ data: { order } });
};

const getOrders = async (req, res) => {
    const pageSize = Number(req.query.pageSize) || 20; //EDIT HERE
    const page = Number(req.query.pageNumber) || 1;
    const dateOrderSortBy = validateConstants(orderQueryParams, 'date', req.query.dateOrder);
    const orderStatusFilter = validateConstants(orderQueryParams, 'orderStatus', req.query.orderStatus);
    const orderFilter = {
        ...orderStatusFilter,
    };
    const count = await Order.countDocuments(orderFilter);
    const orders = await Order.find({ ...orderFilter })
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ ...dateOrderSortBy });
    res.status(200);
    res.json({ orders, page, pages: Math.ceil(count / pageSize), totalOrders: count });
};

const placeOrder = async (req, res, next) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const { shippingAddress, paymentMethod, orderItems, discountCode } = req.body;

    const orderItemIds = [];
    orderItems.map((orderItem) => {
        orderItemIds.push(orderItem.variant);
    });
    //check the existence of product variation
    const orderedProductList = await Variant.find({
        _id: { $in: orderItemIds },
        disabled: false,
        deleted: { $eq: null },
    });
    if (orderItemIds.length > orderedProductList.length) {
        res.status(400);
        throw new Error('Danh sách sản phẩm đặt hàng có sản phẩm không tồn tại');
    }
    let discountCodeExist = null;
    if (discountCode) {
        discountCodeExist = await DiscountCode.findOne({ code: discountCode.toString(), disabled: false });
        if (!discountCodeExist) {
            res.status(400);
            throw new Error('Mã giảm giá không tồn tại');
        }
        if (discountCodeExist.startDate > new Date()) {
            res.status(400);
            throw new Error(`Mã giảm giá có hiệu lực từ ngày ${Date(discountCode.startDate)}`);
        }
        if (discountCodeExist.endDate < new Date()) {
            res.status(400);
            throw new Error('Mã giảm giá đã hết hạn');
        }
        if (!(discountCodeExist.usageLimit > discountCodeExist.used)) {
            res.status(400);
            throw new Error('Mã giảm giá đã được sử dụng hết');
        }
        if (discountCodeExist.usedBy.includes(req.user._id)) {
            res.status(400);
            throw new Error('Mỗi mã giảm giá chỉ được sử dụng 1 lần. Bạn đã sử dụng mã này rồi');
        }
        let count = 0;
        orderedProductList.map((item) => {
            if (discountCodeExist.applicableProducts.includes(item.product)) {
                count++;
            }
        });
        if (count == 0) {
            res.status(400);
            throw new Error('Mã giảm giá không được áp dụng cho các sản phẩm này');
        }
    }

    const session = await mongoose.startSession();
    const transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
    };
    try {
        await session.withTransaction(async () => {
            const newOrder = new Order({
                orderItems: [],
                user: req.user._id,
                username: req.user.name,
                shippingAddress,
                status: 'placed',
            });
            let totalProductPrice = 0;
            const createOrderItems = orderItems.map(async (orderItem) => {
                const orderedVariant = await Variant.findOne({
                    _id: orderItem.variant,
                    disabled: false,
                    deleted: { $eq: null },
                }).populate('product');
                if (!orderedVariant || !orderedVariant.product._id) {
                    await session.abortTransaction();
                    res.status(400);
                    throw new Error(`Sản phẩm có ID "${orderItem.variant}" không tồn tại`);
                }
                if (orderedVariant.quantity < orderItem.quantity) {
                    await session.abortTransaction();
                    res.status(400);
                    throw new Error(
                        `Số lượng đặt hàng của sản phẩm "${orderedVariant.product.name}" vượt quá số lượng trong kho`,
                    );
                }
                orderedVariant.quantity -= orderItem.quantity;
                orderedVariant.product.totalSales += orderItem.quantity;
                orderedVariant.product.quantity -= orderItem.quantity;
                totalProductPrice += orderedVariant.priceSale;
                const newOrderItem = {
                    product: orderedVariant.product._id,
                    name: orderedVariant.product.name,
                    image: orderedVariant.image ? orderedVariant.image : orderedVariant.product.images[0],
                    attributes: orderedVariant.attributes,
                    price: orderedVariant.priceSale,
                    quantity: orderItem.quantity,
                };
                newOrder.orderItems.push(newOrderItem);
                orderedVariant.product.save({ session });
                orderedVariant.save({ session });
            });
            await Promise.all(createOrderItems);
            newOrder.totalProductPrice = totalProductPrice;
            newOrder.statusHistory.push({ status: 'placed' });
            newOrder.totalDiscount = 0;
            if (discountCodeExist) {
                if (discountCodeExist.discountType == 'money') {
                    newOrder.totalDiscount = discountCodeExist.discount;
                } else {
                    newOrder.totalDiscount = Number(
                        ((newOrder.totalProductPrice * discountCodeExist.discount) / 100).toFixed(3),
                    );
                }
            }

            //temporary
            newOrder.shippingPrice = 15000;

            const totalPayment = newOrder.totalProductPrice + newOrder.shippingPrice - newOrder.totalDiscount;
            if (totalPayment >= 0) {
                newOrder.totalPayment = totalPayment;
            } else {
                newOrder.totalPayment = 0;
            }
            const updatedCart = await Cart.findOneAndUpdate(
                { user: req.user._id },
                { $pull: { cartItems: { variant: { $in: orderItemIds } } } },
            ).session(session);
            if (!updatedCart) {
                await session.abortTransaction();
                res.status(500);
                throw new Error('Xóa sản phẩm trong giỏ hàng thất bại');
            }
            const newPaymentInformation = new Payment({
                user: req.user._id,
                order: newOrder._id,
                paymentAmount: newOrder.totalPayment,
            });

            newOrder.paymentInformation = newPaymentInformation._id;

            if (paymentMethod == 'payment-with-momo') {
                newPaymentInformation.paymentMethod = 'payment-with-momo';
                //Create payment information
                const redirectUrl = `${process.env.CLIENT_PAGE_URL}/order/${newOrder._id}`;
                const ipnUrl = `${process.env.API_URL}/api/v1/orders/${newOrder._id}/payment-notification`;
                const requestId = uuidv4();
                const requestBody = createRequestBody(
                    newOrder._id,
                    requestId,
                    'Thanh toán đơn hàng tại Fashion Shop',
                    newOrder.totalPayment,
                    redirectUrl,
                    ipnUrl,
                );
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(requestBody),
                    },
                };
                const { data } = await momo_Request.post('/create', requestBody, config);
                if (data.resultCode == 0) {
                    newPaymentInformation.payUrl = data.payUrl;
                    newPaymentInformation.requestId = requestId;
                } else {
                    await session.abortTransaction();
                    res.status(500);
                    throw new Error('Gặp lỗi khi tạo thông tin thanh toán');
                }
            } else {
                newPaymentInformation.paymentMethod = 'payment-with-cash';
            }
            const createOrderPaymentInformation = await newPaymentInformation.save({ session });
            if (!createOrderPaymentInformation) {
                await session.abortTransaction();
                res.status(500);
                throw new Error('Gặp lỗi khi tạo thông tin thanh toán');
            }
            const createOrder = await newOrder.save({ session });
            if (!createOrder) {
                await session.abortTransaction();
                res.status(500);
                throw new Error('Gặp lỗi khi đặt hàng mới');
            }
            createOrder.paymentInformation = createOrderPaymentInformation;
            res.status(201).json({ message: 'Đặt hàng thành công', data: { newOrder: createOrder } });
        }, transactionOptions);
    } catch (error) {
        next(error);
    } finally {
        await session.endSession();
    }
};

// Update: CONFIRM ORDER
const confirmOrder = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const orderId = req.params.id;
    const description = req.body.description.toString().trim() || '';
    const order = await Order.findOne({ _id: orderId, disabled: false });
    if (!order) {
        res.status(404);
        throw new Error('Đơn hàng không tồn tại!');
    }
    switch (order.status) {
        case 'confirm':
            res.status(400);
            throw new Error('Đơn hàng đã được xác nhận');
        case 'delivering':
            res.status(400);
            throw new Error('Đơn hàng đang ở trạng thái đang giao');
        case 'delivered':
            res.status(400);
            throw new Error('Đơn hàng đã được giao thành công');
        case 'completed':
            res.status(400);
            throw new Error('Đơn hàng đã được hoàn thành');
        case 'cancelled':
            res.status(400);
            throw new Error('Đơn hàng đã bị hủy');
        default:
            break;
    }
    order.statusHistory.push({ status: 'confirm', description: description });
    order.status = 'confirm';

    const updateOrder = await order.save();
    res.status(200).json({ message: 'Xác nhận đơn hàng thành công', data: { updateOrder } });
};
const confirmDelivery = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const orderId = req.params.id;
    const description = req.body.description.toString().trim() || '';
    const order = await Order.findOne({ _id: orderId, disabled: false });
    if (!order) {
        res.status(404);
        throw new Error('Đơn hàng không tồn tại!');
    }
    switch (order.status) {
        case 'placed':
            res.status(400);
            throw new Error('Đơn hàng chưa được xác nhận');
        case 'delivering':
            res.status(400);
            throw new Error('Đơn hàng đã ở trạng thái đang giao');
        case 'delivered':
            res.status(400);
            throw new Error('Đơn hàng đã được giao thành công');
        case 'completed':
            res.status(400);
            throw new Error('Đơn hàng đã được hoàn thành');
        case 'cancelled':
            res.status(400);
            throw new Error('Đơn hàng đã bị hủy');
        default:
            break;
    }
    order.statusHistory.push({ status: 'delivering', description: description });
    order.status = 'delivering';
    const updateOrder = await order.save();
    res.status(200).json({ message: 'Xác nhận đang giao hàng thành công', data: { updateOrder } });
};
const confirmDelivered = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const orderId = req.params.id;
    const description = req.body.description.toString().trim() || '';
    const order = await Order.findOne({ _id: orderId, disabled: false });
    if (!order) {
        res.status(404);
        throw new Error('Đơn hàng không tồn tại!');
    }
    switch (order.status) {
        case 'placed':
            res.status(400);
            throw new Error('Đơn hàng chưa được xác nhận');
        case 'confirm':
            res.status(400);
            throw new Error('Đơn hàng đã ở trạng thái đang giao');

        case 'completed':
            res.status(400);
            throw new Error('Đơn hàng đã được hoàn thành');
        case 'cancelled':
            res.status(400);
            throw new Error('Đơn hàng đã bị hủy');
        default:
            break;
    }
    order.statusHistory.push({ status: 'delivered', description: description });
    order.status = 'delivered';
    const updateOrder = await order.save();
    res.status(200).json({ message: 'Xác nhận đã giao hàng thành công', data: { updateOrder } });
};
const confirmReceived = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const orderId = req.params.id;
    const description = req.body.description.toString().trim() || '';
    const order = await Order.findOne({ _id: orderId, disabled: false });
    if (!order) {
        res.status(404);
        throw new Error('Đơn hàng không tồn tại!');
    }
    switch (order.status) {
        case 'placed':
            res.status(400);
            throw new Error('Đơn hàng chưa được xác nhận');
        case 'confirm':
            res.status(400);
            throw new Error('Đơn hàng  chỉ mới xác nhận chưa bắt đầu giao hàng');
        case 'delivered':
            res.status(400);
            throw new Error('Đơn hàng đã được giao thành công');
        case 'completed':
            res.status(400);
            throw new Error('Đơn hàng đã được hoàn thành');
        case 'cancelled':
            res.status(400);
            throw new Error('Đơn hàng đã bị hủy');
        default:
            break;
    }
    order.statusHistory.push({ status: 'completed', description: description });
    order.status = 'completed';
    const updateOrder = await order.save();
    res.status(200).json({ message: 'Xác nhận đã nhận hàng thành công', data: { updateOrder } });
};

const orderPaymentNotification = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array()[0]);
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const orderId = req.body.orderId.toString().trim() || '';
    if (!orderId) {
        res.status(400);
        throw new Error('Mã đơn hàng là giá trị bắt buộc');
    }
    const order = await Order.findOne({ _id: orderId, disabled: false }).populate('paymentInformation');
    if (!order) {
        res.status(404);
        throw new Error('Đơn hàng không tồn tại!');
    }
    if (
        order.paymentInformation.requestId?.toString() != req.body.requestId?.toString() ||
        Number(order.paymentInformation.paymentAmount) != Number(req.body.amount)
    ) {
        res.status(400);
        throw new Error('Thông tin xác nhận thanh toán không hợp lệ');
    }
    order.paymentInformation.paid = true;
    order.paymentInformation.paidAt = new Date();
    order.paymentInformation.save();
    res.status(200);
};

const userPaymentOrder = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const orderId = req.params.id;
    const order = await Order.findOne({ _id: orderId, user: req.user._id, disabled: false }).populate(
        'paymentInformation',
    );
    if (!order) {
        res.status(404);
        throw new Error('Đơn hàng không tồn tại!');
    }
    if (order.paymentInformation.paid === true) {
        res.status(400);
        throw new Error('Đơn hàng đã hoàn thành việc thanh toán');
    }
    if (order.paymentInformation.paymentMethod == 'payment-with-momo') {
        const payUrl = order.paymentInformation.payUrl;
        res.status(200).json({ data: { payUrl } });
    } else {
        res.status(400);
        throw new Error('Đơn hàng có phương thức thanh toán không phải là thanh toán online');
    }
};

const adminPaymentOrder = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const orderId = req.params.id;
    const order = await Order.findOne({ _id: orderId, disabled: false }).populate('paymentInformation');
    if (!order) {
        res.status(404);
        throw new Error('Đơn hàng không tồn tại!');
    }
    if (order.paymentInformation.paid == true) {
        res.status(400);
        throw new Error('Đơn hàng đã hoàn thành việc thanh toán');
    }
    order.paymentInformation.paid = true;
    order.paymentInformation.paidAt = new Date();
    res.status(200).json({ message: 'Xác nhận thanh toán đơn hàng thành công', data: { order } });
};

const cancelOrder = async (req, res, next) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const orderId = req.params.id;
    const description = req.body.description.toString().trim() || '';
    const order = await Order.findById(orderId);
    if (!order) {
        res.status(404);
        throw new Error('Đơn hàng không tồn tại');
    }
    if (req.user.role == 'admin' || req.user.role == 'staff') {
        switch (order.status) {
            case 'delivered':
                res.status(400);
                throw new Error('Đơn hàng đã được giao thành công. Không thể hủy đơn hàng');
            case 'completed':
                res.status(400);
                throw new Error('Đơn hàng đã được hoàn thành. Không thể hủy đơn hàng');
            case 'cancelled':
                res.status(400);
                throw new Error('Đơn hàng đã bị hủy');
            default:
                break;
        }
    } else {
        switch (order.status) {
            case 'confirm':
                res.status(400);
                throw new Error('Đơn hàng đã được xác nhận. Không thể hủy đơn hàng');
            case 'delivering':
                res.status(400);
                throw new Error('Đơn hàng đang được giao đến bạn. Không thể hủy đơn hàng');
            case 'delivered':
                res.status(400);
                throw new Error('Đơn hàng đã được giao thành công. Không thể hủy đơn hàng');
            case 'completed':
                res.status(400);
                throw new Error('Đơn hàng đã được hoàn thành. Không thể hủy đơn hàng');
            case 'cancelled':
                res.status(400);
                throw new Error('Đơn hàng đã bị hủy');
            default:
                break;
        }
    }
    const session = await mongoose.startSession();
    const transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
    };
    try {
        await session.withTransaction(async () => {
            for (const orderItem of order.orderItems) {
                const returnedVariant = await Variant.findOneAndUpdate(
                    { _id: orderItem.variant },
                    { $inc: { quantity: +orderItem.quantity } },
                    { new: true },
                ).session(session);
                await Product.findOneAndUpdate(
                    { _id: returnedVariant.product },
                    { $inc: { totalSales: -orderItem.quantity, quantity: +orderItem.quantity } },
                ).session(session);
            }
            order.status = 'cancelled';
            order.statusHistory.push({ status: 'cancelled', description: description });
            const cancelledOrder = await order.save();
            if (!cancelledOrder) {
                await session.abortTransaction();
                res.status(500);
                throw new Error('Gặp lỗi khi hủy đơn hàng');
            }
            res.status(200).json({ message: 'Hủy đơn hàng thành công' });
        }, transactionOptions);
    } catch (error) {
        next(error);
    } finally {
        await session.endSession();
    }
};

const orderController = {
    getOrdersByUserId,
    getOrderById,
    getOrders,
    placeOrder,
    confirmOrder,
    confirmDelivery,
    confirmDelivered,
    confirmReceived,
    orderPaymentNotification,
    userPaymentOrder,
    adminPaymentOrder,
    cancelOrder,
};

export default orderController;
