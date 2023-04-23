import mongoose from 'mongoose';

const deliverySchema = mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Order',
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        to_name: {
            type: String,
        },
        to_phone: {
            type: String,
        },
        to_address: {
            type: String,
        },
        to_ward_code: {
            type: Number,
        },
        to_district_id: {
            type: Number,
        },
        weight: {
            type: Number,
        },
        length: {
            type: Number,
        },
        width: {
            type: Number,
        },
        height: {
            type: Number,
        },
        service_id: {
            type: Number,
        },
        required_note: {
            type: String,
        },
        content: {
            type: String,
        },
        items: [
            {
                name: { type: String },
                code: { type: String },
                quantity: { type: Number },
                category: { type: String },
            },
        ],
        order_date: {
            type: Date,
        },
        leadTime: {
            type: Date,
        },
        finish_date: {
            type: Date,
        },
        status: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

const Delivery = mongoose.model('Delivery', deliverySchema);

export default Delivery;
