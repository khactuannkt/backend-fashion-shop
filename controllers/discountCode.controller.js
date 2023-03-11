import * as fs from 'fs';
import DiscountCode from '../models/discountCode.model.js';
import { cloudinaryUpload, cloudinaryRemove } from '../utils/cloudinary.js';
import { validationResult } from 'express-validator';
import { ObjectId } from 'mongodb';

const getDiscountCode = async (req, res) => {
    const discountCode = await DiscountCode.find({ disabled: false }).sort({ _id: -1 });
    return res.status(200).json({ success: true, message: '', data: { discountCode } });
};

const getDiscountCodeById = async (req, res) => {
    const discountCodeId = req.params.id || null;
    if (!ObjectId.isValid(discountCodeId)) {
        res.status(400);
        throw new Error('ID is not valid');
    }
    const discountCode = await DiscountCode.findOne({ _id: discountCodeId });
    if (!discountCode) {
        res.status(404);
        throw new Error('Discount code not found');
    }
    return res.status(200).json({ success: true, message: '', data: { discountCode: discountCode } });
};
const getDiscountCodeByCode = async (req, res) => {
    const code = req.params.code || null;
    const discountCode = await DiscountCode.findOne({ code: code });
    if (!discountCode) {
        res.status(404);
        throw new Error('Discount code not found');
    }
    return res.status(200).json({ success: true, message: '', data: { discountCode: discountCode } });
};
const createDiscountCode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'An error occurred', ...errors });
    }
    const { code, discountType, discount, startDate, endDate, isUsageLimit, usageLimit, applicableProducts } = req.body;

    const discountCodeExists = await DiscountCode.findOne({ code: code });
    if (discountCodeExists) {
        res.status(409);
        throw new Error('This Discount code already exists');
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
    return res.status(201).json({ success: true, message: 'DiscountCode are added', data: { newDiscountCode } });
};

const updateDiscountCode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'An error occurred', ...errors });
    }
    const { code, discountType, discount, startDate, endDate, isUsageLimit, usageLimit, applicableProducts } = req.body;
    // Check id
    const discountCodeId = req.params.id || null;
    if (!ObjectId.isValid(discountCodeId)) {
        res.status(400);
        throw new Error('ID is not valid');
    }
    const currentDiscountCode = await DiscountCode.findById(discountCodeId);
    if (!currentDiscountCode) {
        return res.status(404).json({ success: true, message: 'Discount code not found' });
    }
    const discountCodeExists = await DiscountCode.findOne({ code: code });
    if (discountCodeExists) {
        res.status(409);
        throw new Error('This Discount code already exists');
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
    return res.status(201).json({ success: true, message: 'DiscountCode are added', data: { updateDiscountCode } });
};

const deleteDiscountCode = async (req, res) => {
    const deletedDiscountCode = await DiscountCode.findByIdAndDelete(req.params.id);
    if (!deletedDiscountCode) {
        res.status(404);
        throw new Error('Discount not found');
    }
    res.status(200).json({ success: true, message: 'Discount code is deleted' });
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
