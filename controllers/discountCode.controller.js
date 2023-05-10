import * as fs from 'fs';
import DiscountCode from '../models/discountCode.model.js';
import Variant from '../models/variant.model.js';
import { cloudinaryUpload, cloudinaryRemove } from '../utils/cloudinary.js';
import { validationResult } from 'express-validator';
import { ObjectId } from 'mongodb';
import User from '../models/user.model.js';
//CONSTANT
const TYPE_DISCOUNT_MONEY = 1;
const TYPE_DISCOUNT_PERCENT = 2;

const getDiscountCode = async (req, res) => {
    const discountCode = await DiscountCode.find({ disabled: false }).sort({ _id: -1 });
    return res.status(200).json({ success: true, message: '', data: { discountCode } });
};

const getDiscountCodeById = async (req, res) => {
    const discountCodeId = req.params.id || null;
    if (!ObjectId.isValid(discountCodeId)) {
        res.status(400);
        throw new Error('ID mã giảm giá không hợp lệ');
    }
    const discountCode = await DiscountCode.findOne({ _id: discountCodeId });
    if (!discountCode) {
        res.status(404);
        throw new Error('Mã giảm giá không tồn tại');
    }
    return res.status(200).json({ message: 'Success', data: { discountCode: discountCode } });
};
const getDiscountCodeByCode = async (req, res) => {
    const code = req.params.code || null;
    const discountCode = await DiscountCode.findOne({ code: code });
    if (!discountCode) {
        res.status(404);
        throw new Error('Mã giảm giá không tồn tại');
    }
    return res.status(200).json({ message: 'Success', data: { discountCode: discountCode } });
};
const createDiscountCode = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const { code, discountType, discount, startDate, endDate, isUsageLimit, usageLimit, applicableProducts } = req.body;

    const discountCodeExists = await DiscountCode.findOne({ code: code });
    if (discountCodeExists) {
        res.status(409);
        throw new Error('Mã giảm giá đã tồn tại');
    }

    const discountCode = new DiscountCode({
        code,
        discountType,
        discount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isUsageLimit,
        usageLimit,
        applicableProducts,
    });
    const newDiscountCode = await discountCode.save();
    return res.status(201).json({ message: 'Mã giảm giá đã được thêm', data: { newDiscountCode } });
};

const updateDiscountCode = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const { code, discountType, discount, startDate, endDate, isUsageLimit, usageLimit, applicableProducts } = req.body;
    // Check id
    const discountCodeId = req.params.id || null;
    if (!ObjectId.isValid(discountCodeId)) {
        res.status(400);
        throw new Error('ID Mã giảm giá không hợp lệ');
    }
    const currentDiscountCode = await DiscountCode.findById(discountCodeId);
    if (!currentDiscountCode) {
        return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    }
    const discountCodeExists = await DiscountCode.findOne({ code: code });
    if (discountCodeExists && discountCodeExists._id.toString() !== currentDiscountCode._id.toString()) {
        res.status(409);
        throw new Error('Mã giảm giá đã tồn tại');
    }

    currentDiscountCode.code = code || currentDiscountCode.code;
    currentDiscountCode.discountType = discountType || currentDiscountCode.discountType;

    currentDiscountCode.discount = discount || currentDiscountCode.discount;
    currentDiscountCode.startDate = startDate || currentDiscountCode.startDate;
    currentDiscountCode.endDate = endDate || currentDiscountCode.endDate;
    currentDiscountCode.isUsageLimit = isUsageLimit || currentDiscountCode.isUsageLimit;
    currentDiscountCode.usageLimit = usageLimit || currentDiscountCode.usageLimit;
    currentDiscountCode.applicableProducts = applicableProducts || currentDiscountCode.applicableProducts;

    const updateDiscountCode = await currentDiscountCode.save();
    return res
        .status(200)
        .json({ success: true, message: 'Cập nhật mã giảm giá thành công', data: { updateDiscountCode } });
};

const discountCalculation = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const { orderItems, discountCode } = req.body;
    const discountCodeExist = await DiscountCode.findOne({ code: String(discountCode), disabled: false });
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
    if (discountCodeExist.isUsageLimit && !(discountCodeExist.usageLimit <= discountCodeExist.used)) {
        res.status(400);
        throw new Error('Mã giảm giá đã được sử dụng hết');
    }
    if (discountCodeExist.usedBy.includes(req.user._id)) {
        res.status(400);
        throw new Error('Mỗi mã giảm giá chỉ được sử dụng 1 lần. Bạn đã sử dụng mã này rồi');
    }

    let totalProductPrice = 0;
    const orderedProductList = [];
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
            totalProductPrice += orderedVariant.priceSale * orderItem.quantity;

            orderedProductList.push({
                _id: orderedVariant.product._id,
                priceSale: orderedVariant.priceSale,
                quantity: orderItem.quantity,
            });
        }),
    );
    // Tổng giá sản phẩm nằm trong danh sách được giảm giá của discount code
    let totalPriceProductDiscounted = 0;
    if (discountCodeExist.applyFor == 1) {
        totalPriceProductDiscounted = totalProductPrice;
    } else {
        let count = 0;
        orderedProductList.map((item) => {
            if (discountCodeExist.applicableProducts.includes(item._id)) {
                totalPriceProductDiscounted += item.priceSale * item.quantity;
                count++;
            }
        });
        if (count == 0) {
            res.status(400);
            throw new Error('Mã giảm giá không được áp dụng cho các sản phẩm này');
        }
    }
    let discount = 0;
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
    res.status(200).json({
        message: 'Success',
        data: {
            totalDiscount: discount,
            discountCode: discountCodeExist.code,
        },
    });
};

const deleteDiscountCode = async (req, res) => {
    const discountCodeId = req.params.id || null;
    if (!ObjectId.isValid(discountCodeId)) {
        res.status(400);
        throw new Error('ID mã giảm giá không hợp lệ');
    }
    await User.updateMany({ $pull: { discountCode: discountCodeId } });
    const deletedDiscountCode = await DiscountCode.findByIdAndDelete(discountCodeId);
    if (!deletedDiscountCode) {
        res.status(404);
        throw new Error('Mã giảm giá không tồn tại');
    }
    res.status(200).json({ message: 'Xóa mã giảm giá thành công' });
};

const bannerController = {
    getDiscountCode,
    getDiscountCodeById,
    getDiscountCodeByCode,
    discountCalculation,
    createDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,
};
export default bannerController;
