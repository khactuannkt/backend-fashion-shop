import mongoose from 'mongoose';

const discountCodeSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
        },
        discountType: {
            type: String,
            required: true,
            enum: ['percent', 'money'],
            default: 'money',
        },
        discount: {
            type: Number,
            required: true,
            default: 0,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        isUsageLimit: {
            type: Boolean,
            required: true,
            default: false,
        },
        usageLimit: {
            type: Number,
            default: 0,
        },
        used: {
            type: Number,
            required: true,
            default: 0,
        },
        usedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        applicableProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
        ],
        disabled: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

const DiscountCode = mongoose.model('DiscountCode', discountCodeSchema);

export default DiscountCode;
