import mongoose from 'mongoose';

const variantSchema = mongoose.Schema(
    {
        // product: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     required: true,
        //     ref: 'Product',
        // },
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
        priceSale: {
            type: Number,
            required: true,
        },
        image: {
            type: Number,
        },
        quantity: {
            type: Number,
            required: true,
        },
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

const Variant = mongoose.model('Variant', variantSchema);
export default Variant;
