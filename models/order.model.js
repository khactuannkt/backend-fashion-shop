import mongoose from 'mongoose';

const orderStatus = mongoose.Schema(
    {
        status: {
            type: String,
            required: true,
            enum: ['pending', 'delivering', 'delivered', 'cancelled'],
            default: 'pending',
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
    size: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
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
            phone: {
                type: String,
                required: true,
            },
            address: {
                type: String,
                required: true,
            },
            city: {
                type: String,
                required: true,
            },
            zipCode: {
                type: String,
                required: false,
            },
            country: {
                type: String,
                required: true,
            },
        },
        paymentMethod: {
            type: String,
            required: true,
            default: 'Payment in cash',
        },
        taxPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        shippingPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        discountCode: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'DiscountCode',
            },
        ],
        totalDiscount: {
            type: Number,
            required: true,
            default: 0,
        },
        totalPrice: {
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
