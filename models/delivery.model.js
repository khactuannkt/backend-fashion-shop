import mongoose from 'mongoose';

const deliverySchema = mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Order',
        },
        client: {
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
        to_province_name: {
            type: String,
        },
        to_district_name: {
            type: String,
        },
        to_ward_name: {
            type: String,
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
        note: {
            type: String,
        },
        required_note: {
            type: String,
            required: true,
            enum: [
                'CHOTHUHANG',
                'CHOXEMHANGKHONGTHU',
                'KHONGCHOXEMHANG',
                'CHOTHUHANG',
                'CHOXEMHANGKHONGTHU',
                'KHONGCHOXEMHANG',
            ],
            default: 'KHONGCHOXEMHANG',
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
        insurance_value: {
            type: Number,
        },
        start_date: {
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
