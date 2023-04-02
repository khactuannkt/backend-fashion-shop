import mongoose from 'mongoose';

const orderStatus = mongoose.Schema(
    {
        status: {
            type: String,
            required: true,
            enum: ['placed', 'confirm', 'delivering', 'delivered', 'cancelled', 'completed'],
            default: 'placed',
        },
        description: {
            type: String,
            required: false,
            default: '',
        },
    },
    {
        timestamps: true,
    },
);
const orderItem = mongoose.Schema({
    // variant: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     required: true,
    //     ref: 'Variant',
    // },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    attributes: [
        {
            name: { type: String, required: true },
            value: { type: String, required: true },
        },
    ],
    price: {
        type: Number,
        required: true,
    },
    isAbleToReview: {
        type: Boolean,
        required: true,
        default: false,
    },
});
const orderSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        username: {
            type: String,
            required: true,
        },
        orderItems: [orderItem],
        shippingAddress: {
            receiver: {
                type: String,
                required: true,
            },
            phone: {
                type: String,
                required: true,
            },
            province: {
                type: String,
                default: '',
            },
            district: {
                type: String,
                default: '',
            },
            ward: {
                type: String,
                default: '',
            },
            specificAddress: {
                type: String,
                default: '',
            },
        },
        // paymentMethod: {
        //     type: String,
        //     required: true,
        //     enum: ['payment-with-cash', 'payment-with-momo'],
        //     default: 'payment-with-cash',
        // },
        paymentInformation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment',
        },
        shippingPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        discountCode: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DiscountCode',
        },
        totalDiscount: {
            type: Number,
            required: true,
            default: 0,
        },
        totalProductPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        totalPayment: {
            type: Number,
            required: true,
            default: 0.0,
        },
        status: {
            type: String,
            required: true,
        },
        statusHistory: [orderStatus],
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

const Order = mongoose.model('Order', orderSchema);

export default Order;
