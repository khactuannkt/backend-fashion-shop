import * as fs from 'fs';
import DiscountCode from '../models/discountCode.model.js';
import { cloudinaryUpload, cloudinaryRemove } from '../utils/cloudinary.js';
import { validationResult } from 'express-validator';
import { ObjectId } from 'mongodb';
import User from '../models/user.model.js';

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
        startDate,
        endDate,
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
    createDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,
};
export default bannerController;
