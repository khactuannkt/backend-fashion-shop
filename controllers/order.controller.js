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
import { momo_Request, GHN_Request } from '../utils/request.js';
import Delivery from '../models/delivery.model.js';

//CONSTANT
const TYPE_DISCOUNT_MONEY = 1;
const TYPE_DISCOUNT_PERCENT = 2;
const PAYMENT_WITH_CASH = 1;
const PAYMENT_WITH_MOMO = 2;
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
        .populate(['delivery', 'paymentInformation'])
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
    const order = await Order.findById(req.params.id).populate(['delivery', 'paymentInformation']);
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
    const limit = Number(req.query.limit) || 20; //EDIT HERE
    const page = Number(req.query.page) || 0;
    const sortBy = validateConstants(orderQueryParams, 'sort', req.query.sortBy);
    const orderStatusFilter = validateConstants(orderQueryParams, 'status', req.query.status);
    const orderFilter = {
        ...orderStatusFilter,
    };
    const count = await Order.countDocuments(orderFilter);
    const orders = await Order.find({ ...orderFilter })
        .populate(['delivery', 'paymentInformation'])
        .limit(limit)
        .skip(limit * page)
        .sort({ ...sortBy });
    res.status(200);
    res.json({ data: { orders, page, pages: Math.ceil(count / limit), total: count } });
};

const checkOrderProductList = async (size, orderItems) => {
    const result = {
        error: 0,
        message: '',
        orderItemIds: [],
        orderedProductList: [],
        totalProductPrice: 0,
    };
    await Promise.all(
        orderItems.map(async (orderItem) => {
            const orderedVariant = await Variant.findOne({
                _id: orderItem.variant,
                disabled: false,
                deleted: { $eq: null },
            }).populate('product');
            if (!orderedVariant || !orderedVariant.product?._id) {
                throw new Error(`Sản phẩm có ID "${orderItem.variant}" không tồn tại`);
            }
            if (orderedVariant.quantity < orderItem.quantity) {
                throw new Error(
                    `Số lượng đặt hàng của sản phẩm "${orderedVariant.product.name}" vượt quá số lượng trong kho`,
                );
            }
            size.height += orderedVariant.product.height * orderItem.quantity;
            size.weight += orderedVariant.product.weight * orderItem.quantity;
            size.length += orderedVariant.product.length;
            size.width += orderedVariant.product.width;
            result.totalProductPrice += orderedVariant.priceSale * orderItem.quantity;
            result.orderItemIds.push(orderItem.variant);
            result.orderedProductList.push({
                _id: orderedVariant.product._id,
                priceSale: orderedVariant.priceSale,
                quantity: orderItem.quantity,
            });
        }),
    ).catch((error) => {
        result.error = 1;
        result.message = error.message;
        result.orderItemIds = [];
    });
    //temp
    size.height = 5;
    size.length = 5;
    size.width = 5;
    return result;
};

const calculateFee = async (shippingAddress, size, price) => {
    const deliveryFee = {
        fee: 0,
        error: 0,
        status: 200,
        message: '',
    };
    if (size.weight == 0) {
        size.weight = 1;
    }
    const config = {
        data: JSON.stringify({
            service_id: 53320,
            to_district_id: Number(shippingAddress.to_district_id),
            to_ward_code: shippingAddress.to_ward_code,
            height: size.height,
            length: size.length,
            weight: size.weight,
            width: size.width,
            insurance_value: price,
        }),
    };
    await GHN_Request.get('v2/shipping-order/fee', config)
        .then((response) => {
            deliveryFee.fee = response.data.data.total;
        })
        .catch((error) => {
            deliveryFee.error = 1;
            if (error?.response?.status && error.response.status == '400') {
                deliveryFee.status = 400;
                deliveryFee.message = 'Sai thông tin giao hàng. Vui lòng thử lại.';
            } else {
                deliveryFee.status = 500;
                deliveryFee.message =
                    error.response?.message || error.message || 'Xảy ra lỗi trong quá trình tính phí vận chuyển';
            }
        });
    return deliveryFee;
};

const estimatedDeliveryTime = async (shippingAddress) => {
    const result = {
        leadTime: null,
        error: 0,
        status: 200,
        message: '',
    };
    const config = {
        data: JSON.stringify({
            service_id: 53350,
            to_district_id: shippingAddress.to_district_id,
            to_ward_code: String(shippingAddress.to_ward_code),
        }),
    };
    await GHN_Request.get('v2/shipping-order/leadtime', config)
        .then((response) => {
            result.leadTime = response.data.data.leadtime;
        })
        .catch((error) => {
            result.error = 1;
            if (error?.response?.status && error.response.status == '400') {
                result.status = 400;
                result.message = 'Sai thông tin giao hàng. Vui lòng thử lại.';
            } else {
                result.status = 500;
                result.message =
                    error.response?.message ||
                    error.message ||
                    'Xảy ra lỗi trong quá trình tính thời gian giao hàng dự kiến';
            }
        });
    return result;
};
const getAddressName = async (shippingAddress) => {
    const result = {
        error: 0,
        message: '',
        address: {
            ...shippingAddress,
            provinceName: '',
            districtName: '',
            wardName: '',
        },
    };
    try {
        // Get province
        await GHN_Request.get('/master-data/province')
            .then((response) => {
                const provinces = response.data.data;
                provinces.map((item) => {
                    if (item.ProvinceID == shippingAddress.to_province_id) {
                        result.address.provinceName = item.ProvinceName;
                    }
                });
            })
            .catch((error) => {
                throw new Error(
                    error.response?.message || error.message || 'Lấy danh sách tỉnh thành phố không thành công',
                );
            });
        //Get district
        await GHN_Request.get('/master-data/district', {
            data: JSON.stringify({
                province_id: shippingAddress.to_province_id,
            }),
        })
            .then((response) => {
                const districts = response.data.data;
                districts.map((item) => {
                    if (item.DistrictID == shippingAddress.to_district_id) {
                        result.address.districtName = item.DistrictName;
                    }
                });
            })
            .catch((error) => {
                throw new Error(error.response?.message || error.message);
            });
        //Get ward
        await GHN_Request.get('/master-data/ward', {
            data: JSON.stringify({
                district_id: shippingAddress.to_district_id,
            }),
        })
            .then((response) => {
                const wards = response.data.data;
                wards.map((item) => {
                    if (item.WardCode == shippingAddress.to_ward_code) {
                        result.address.wardName = item.WardName;
                    }
                });
            })
            .catch((error) => {
                throw new Error(error.response?.message || error.message);
            });
        if (!result.address.provinceName) {
            throw new Error('Tỉnh/Thành phố không hợp lệ');
        }
        if (!result.address.districtName) {
            throw new Error('Quận/Huyện không hợp lệ');
        }
        if (!result.address.wardName) {
            throw new Error('Xã/Phường không hợp lệ');
        }
        return result;
    } catch (error) {
        result.error = 1;
        result.message = error.message;
        return result;
    }
};

const createOrder = async (req, res, next) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const { shippingAddress, paymentMethod, orderItems, discountCode } = req.body;

    const size = {
        height: 0,
        weight: 0,
        length: 0,
        width: 0,
    };
    const productCheckResult = await checkOrderProductList(size, orderItems);
    if (productCheckResult.error) {
        res.status(400);
        throw new Error(productCheckResult.message);
    }

    const calculateDeliveryFee = calculateFee(shippingAddress, size, productCheckResult.totalProductPrice);
    const calculateLeadTime = estimatedDeliveryTime(shippingAddress);
    const getAddress = getAddressName(shippingAddress);
    const [deliveryFee, leadTimeResult, addressResult] = await Promise.all([
        calculateDeliveryFee,
        calculateLeadTime,
        getAddress,
    ]);
    if (deliveryFee.error) {
        res.status(deliveryFee.status);
        throw new Error(deliveryFee.message);
    }
    if (leadTimeResult.error) {
        res.status(leadTimeResult.status);
        throw new Error(leadTimeResult.message);
    }
    if (addressResult.error) {
        res.status(400);
        throw new Error(addressResult.message);
    }

    const address = addressResult.address;

    const session = await mongoose.startSession();
    const transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
    };

    try {
        await session.withTransaction(async () => {
            // const newOrderItems = await createOrderItems(session, orderItems);
            const dataOrderItem = [];
            const createOrderItems = orderItems.map(async (orderItem) => {
                const orderedVariant = await Variant.findOneAndUpdate(
                    {
                        _id: orderItem.variant,
                        quantity: { $gte: orderItem.quantity },
                        disabled: false,
                        deleted: { $eq: null },
                    },
                    { $inc: { quantity: -orderItem.quantity } },
                    { new: true },
                ).session(session);
                if (!orderedVariant) {
                    await session.abortTransaction();
                    res.status(400);
                    throw new Error(`Sản phẩm có ID "${orderItem.variant}" đã hết hàng`);
                }
                const orderedProduct = await Product.findOneAndUpdate(
                    { _id: orderedVariant.product, disabled: false, deleted: { $eq: null } },
                    { $inc: { totalSales: +orderItem.quantity, quantity: -orderItem.quantity } },
                ).session(session);
                // await Promise.all([orderedVariant, orderedProduct]);
                if (!orderedProduct) {
                    await session.abortTransaction();
                    res.status(400);
                    throw new Error(`Sản phẩm có ID "${orderItem.variant}" không tồn tại`);
                }

                const newOrderItem = {
                    product: orderedProduct._id,
                    name: orderedProduct.name,
                    attributes: orderedVariant.attributes,
                    image: orderedVariant.image || null,
                    price: orderedVariant.priceSale,
                    quantity: orderItem.quantity,
                };
                if (!newOrderItem.image) {
                    newOrderItem.image = orderedProduct.images[0] || null;
                }
                dataOrderItem.push(newOrderItem);
            });
            await Promise.all(createOrderItems);

            // create order information
            const orderInfor = new Order({
                orderItems: dataOrderItem,
                user: req.user._id,
                username: req.user.name,
                totalProductPrice: productCheckResult.totalProductPrice || 0,
                shippingPrice: deliveryFee.fee,
                totalDiscount: 0,
                status: 'placed',
                statusHistory: { status: 'placed', updateBy: req.user._id },
            });

            //Check discount code
            if (discountCode) {
                const code = String(discountCode) || '';
                const discountCodeExist = await DiscountCode.findOne({ code: code, disabled: false });
                if (!discountCodeExist) {
                    await session.abortTransaction();
                    res.status(400);
                    throw new Error('Mã giảm giá không tồn tại');
                }
                if (discountCodeExist.startDate > new Date()) {
                    await session.abortTransaction();
                    res.status(400);
                    throw new Error(`Mã giảm giá có hiệu lực từ ngày ${Date(discountCode.startDate)}`);
                }
                if (discountCodeExist.endDate < new Date()) {
                    await session.abortTransaction();
                    res.status(400);
                    throw new Error('Mã giảm giá đã hết hạn');
                }
                if (discountCodeExist.isUsageLimit && !(discountCodeExist.usageLimit <= discountCodeExist.used)) {
                    await session.abortTransaction();
                    res.status(400);
                    throw new Error('Mã giảm giá đã được sử dụng hết');
                }
                if (discountCodeExist.usedBy.includes(req.user._id)) {
                    await session.abortTransaction();
                    res.status(400);
                    throw new Error('Mỗi mã giảm giá chỉ được sử dụng 1 lần. Bạn đã sử dụng mã này rồi');
                }
                // Tổng giá sản phẩm nằm trong danh sách được giảm giá của discount code
                let totalPriceProductDiscounted = 0;
                if (discountCodeExist.applyFor == 1) {
                    totalPriceProductDiscounted = productCheckResult.totalProductPrice;
                } else {
                    let count = 0;
                    productCheckResult.orderedProductList.map((item) => {
                        if (discountCodeExist.applicableProducts.includes(item._id)) {
                            totalPriceProductDiscounted += item.priceSale * item.quantity;
                            count++;
                        }
                    });
                    if (count == 0) {
                        await session.abortTransaction();
                        res.status(400);
                        throw new Error('Mã giảm giá không được áp dụng cho các sản phẩm này');
                    }
                }
                let discount;
                if (discountCodeExist.discountType == TYPE_DISCOUNT_MONEY) {
                    if (totalPriceProductDiscounted >= discountCodeExist.discount) {
                        discount = discountCodeExist.discount;
                    } else {
                        discount = totalPriceProductDiscounted;
                    }
                } else if (discountCodeExist.discountType == TYPE_DISCOUNT_PERCENT) {
                    discount = ((totalPriceProductDiscounted * discountCodeExist.discount) / 100).toFixed(3);
                    if (discount > discountCodeExist.maximumDiscount) {
                        discount = discountCodeExist.maximumDiscount;
                    }
                }
                discountCodeExist.usedBy.push(req.user._id);
                discountCodeExist.used++;
                await discountCodeExist.save({ session });

                orderInfor.totalDiscount = discount;
            }

            const totalPayment = orderInfor.totalProductPrice + deliveryFee.fee - orderInfor.totalDiscount;

            if (totalPayment >= 0) {
                orderInfor.totalPayment = totalPayment;
            } else {
                orderInfor.totalPayment = 0;
            }
            let leadTime = new Date(leadTimeResult.leadTime * 1000);
            if (leadTime == 'Invalid Date') {
                leadTime = null;
            }
            const newShippingInfor = new Delivery({
                order: orderInfor._id,
                client: req.user._id,
                to_name: address.to_name,
                to_phone: address.to_phone,
                to_province_name: address.provinceName,
                to_district_name: address.districtName,
                to_ward_name: address.wardName,
                to_province_id: address.to_province_id,
                to_district_id: address.to_district_id,
                to_ward_code: address.to_ward_code,
                to_address: address.to_address,
                note: address.note,
                service_id: 53320,
                items: orderInfor.orderItems,
                deliveryFee: deliveryFee.fee,
                leadTime: leadTime,
                height: size.height,
                length: size.length,
                weight: size.weight,
                width: size.width,
                insurance_value: orderInfor.totalProductPrice,
            });
            const newShipping = await newShippingInfor.save({ session });
            if (!newShipping) {
                await session.abortTransaction();
                res.status(502);
                throw new Error('Gặp lỗi khi tạo thông tin giao hàng');
            }
            orderInfor.delivery = newShipping._id;

            const newPaymentInformation = new Payment({
                user: req.user._id,
                order: orderInfor._id,
                paymentAmount: orderInfor.totalPayment,
            });
            newPaymentInformation.paymentMethod = paymentMethod;

            if (newPaymentInformation.paymentMethod == PAYMENT_WITH_MOMO) {
                //Create payment information with momo
                const redirectUrl = `${process.env.CLIENT_PAGE_URL}/order/${orderInfor._id}`;
                const ipnUrl = `${process.env.API_URL}/api/v1/orders/${orderInfor._id}/payment-notification`;
                const requestId = uuidv4();
                const requestBody = createRequestBody(
                    orderInfor._id,
                    requestId,
                    'Thanh toán đơn hàng tại Fashion Shop',
                    orderInfor.totalPayment,
                    redirectUrl,
                    ipnUrl,
                );
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(requestBody),
                    },
                };
                await momo_Request
                    .post('/create', requestBody, config)
                    .then((response) => {
                        newPaymentInformation.payUrl = response.data.shortLink;
                        newPaymentInformation.requestId = requestId;
                    })
                    .catch(async (error) => {
                        await session.abortTransaction();
                        res.status(400);
                        throw new Error(error.response?.message || error.message);
                    });
            } else if (newPaymentInformation.paymentMethod != PAYMENT_WITH_CASH) {
                await session.abortTransaction();
                res.status(400);
                throw new Error('Phương thức thanh toán không hợp lệ');
            }
            const createOrderPaymentInformation = await newPaymentInformation.save({ session });
            if (!createOrderPaymentInformation) {
                await session.abortTransaction();
                res.status(400);
                throw new Error('Gặp lỗi trong quá trình tạo thông tin thanh toán');
            }

            orderInfor.paymentInformation = createOrderPaymentInformation._id;

            await Cart.findOneAndUpdate(
                { user: req.user._id },
                { $pull: { cartItems: { variant: { $in: productCheckResult.orderItemIds } } } },
            ).session(session);
            const newOrder = await (await orderInfor.save({ session })).populate(['delivery', 'paymentInformation']);

            if (!newOrder) {
                await session.abortTransaction();
                res.status(502);
                throw new Error('Xảy ra lỗi trong quá trình tạo đơn hàng');
            }
            res.status(201).json({ message: 'Đặt hàng thành công', data: { newOrder } });
            await session.commitTransaction();
        }, transactionOptions);
    } catch (error) {
        next(error);
    } finally {
        session.endSession();
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
    const orderId = req.params.id || '';
    const description = String(req.body.description) || '';
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
    order.statusHistory.push({ status: 'confirm', description: description, updateBy: req.user._id });
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
    const description = req.body.description?.toString().trim() || '';
    const order = await Order.findOne({ _id: orderId, disabled: false }).populate('delivery');
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
    const config = {
        data: JSON.stringify({
            payment_type_id: 1,
            note: '',
            required_note: order.delivery.required_note,
            client_order_code: order.user,
            to_name: order.delivery.to_name,
            to_phone: order.delivery.to_phone,
            to_address: order.delivery.to_address,
            to_ward_name: order.delivery.to_ward_name,
            to_district_name: order.delivery.to_district_name,
            to_province_name: order.delivery.to_province_name,
            cod_amount: order.totalPayment,
            // content,
            weight: order.delivery.weight,
            length: order.delivery.length,
            width: order.delivery.width,
            height: order.delivery.height,
            insurance_value: order.delivery.insurance_value,
            service_id: order.delivery.service_id,
            // pickup_time,
            items: order.delivery.items,
        }),
    };
    const deliveryInfo = await GHN_Request.get('v2/shipping-order/create', config)
        .then((response) => {
            return response.data.data;
        })
        .catch((error) => {
            res.status(error.code || 502);
            throw new Error(error.message || error.response?.message || null);
        });
    order.delivery.start_date = new Date();
    order.delivery.leadTime = deliveryInfo.expected_delivery_time || order.delivery.leadTime;
    order.delivery.deliveryFee = deliveryInfo.total_fee || order.delivery.deliveryFee;
    order.delivery.deliveryCode = deliveryInfo.order_code || order.delivery.deliveryCode;
    // order.delivery.statusHistory = deliveryInfo.log || order.delivery.statusHistory;
    order.statusHistory.push({
        status: 'delivering',
        description: description,
        updateBy: req.user._id,
    });
    order.status = 'delivering';
    await order.delivery.save();
    const updateOrder = await (await order.save()).populate(['delivery', 'paymentInformation']);
    res.status(200).json({ message: 'Đơn giao hàng đã đặt thành công', data: { updateOrder } });
};
const confirmDelivered = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const orderId = req.params.id || '';
    const description = req.body.description?.toString()?.trim() || '';
    const order = await Order.findOne({ _id: orderId, disabled: false }).populate('delivery');
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
    order.delivery.statusHistory.push({ status: 'delivered', updated_date: new Date() });
    order.delivery.status = 'delivered';
    order.delivery.finish_date = new Date();
    order.statusHistory.push({ status: 'delivered', description: description, updateBy: req.user._id });
    order.status = 'delivered';
    await order.delivery.save();
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
    const description = req.body.description?.toString()?.trim() || '';
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
    order.statusHistory.push({ status: 'completed', description: description, updateBy: req.user._id });
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
        order.paymentInformation?.requestId?.toString() != req.body.requestId?.toString() ||
        Number(order.paymentInformation.paymentAmount) != Number(req.body.amount)
    ) {
        res.status(400);
        throw new Error('Thông tin xác nhận thanh toán không hợp lệ');
    }
    order.statusHistory.push({ status: 'paid', updateBy: order.user });
    order.paymentInformation.paid = true;
    order.paymentInformation.paidAt = new Date();
    await order.paymentInformation.save();
    await order.save();
    res.status(204);
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
    order.statusHistory.push({
        status: 'paid',
        updateBy: req.user._id,
    });
    await order.paymentInformation.save();
    const updateOrder = await (await order.save()).populate(['delivery', 'paymentInformation']);
    res.status(200).json({ message: 'Xác nhận thanh toán đơn hàng thành công', data: { updateOrder } });
};

const cancelOrder = async (req, res, next) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const orderId = req.params.id || '';
    const description = req.body.description?.toString()?.trim() || '';
    const order = await Order.findOne({ _id: orderId });
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
    } else if (req.user._id == order.user) {
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
    } else {
        res.status(404);
        throw new Error('Đơn hàng không tồn tại');
    }
    const session = await mongoose.startSession();
    const transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
    };
    try {
        await session.withTransaction(async () => {
            order.orderItems.map(async (orderItem) => {
                const updateProduct = Product.findOneAndUpdate(
                    { _id: orderItem.product },
                    { $inc: { totalSales: -orderItem.quantity, quantity: +orderItem.quantity } },
                ).session(session);
                const updateVariant = Variant.findOneAndUpdate(
                    { product: product._id, attributes: orderItem.attributes },
                    { $inc: { quantity: +orderItem.quantity } },
                    { new: true },
                ).session(session);
                await Promise.all([updateProduct, updateVariant]);
            });
            order.status = 'cancelled';
            order.statusHistory.push({ status: 'cancelled', description: description });
            const cancelledOrder = await order.save();
            if (!cancelledOrder) {
                await session.abortTransaction();
                res.status(502);
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
    createOrder,
    // placeOrder,
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
