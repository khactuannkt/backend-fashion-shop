import mongoose from 'mongoose';

const paymentSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Order',
        },
        requestId: {
            type: String,
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: ['payment-with-cash', 'payment-with-momo'],
            default: 'payment-with-cash',
        },
        payUrl: {
            type: String,
            default: null,
        },
        paymentAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        paid: {
            type: Boolean,
            required: true,
            default: false,
        },
        paidAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
