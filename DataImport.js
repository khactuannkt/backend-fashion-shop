import express from 'express';
import User from './models/user.model.js';
import Product from './models/product.model.js';
import Slider from './models/slider.model.js';
import users from './data/users.js';
import products from './data/Products.js';
import asyncHandler from 'express-async-handler';
import { slider } from './data/slider.js';
const ImportData = express.Router();

ImportData.post(
    '/user',
    asyncHandler(async (req, res) => {
        await User.remove({});
        const importUser = await User.insertMany(users);
        res.send({ importUser });
    }),
);

ImportData.post(
    '/product',
    asyncHandler(async (req, res) => {
        await Product.remove({});
        const importProducts = await Product.insertMany(products);
        res.send({ importProducts });
    }),
);
ImportData.post(
    '/slider',
    asyncHandler(async (req, res) => {
        await Slider.remove({});
        const importSlider = await Slider.insertMany(slider);
        res.send({ importSlider });
    }),
);

export default ImportData;
