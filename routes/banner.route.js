import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect, auth } from '../middlewares/auth.middleware.js';
import { multerUpload } from '../utils/multer.js';
import bannerController from '../controllers/banner.controller.js';

const bannerRouter = express.Router();

bannerRouter.get('/', asyncHandler(bannerController.getBanners));

bannerRouter.get('/:id', asyncHandler(bannerController.getBannerById));

bannerRouter.post(
    '/',
    protect,
    auth('admin'),
    multerUpload.array('banner', 5),
    asyncHandler(bannerController.createBanners),
);

bannerRouter.patch('/:id/increaseIndex', protect, auth('admin'), asyncHandler(bannerController.increaseIndex));

bannerRouter.patch('/:id/decreaseIndex', protect, auth('admin'), asyncHandler(bannerController.decreaseIndex));

bannerRouter.delete('/:id', protect, auth('admin'), asyncHandler(bannerController.deleteBanner));

bannerRouter.put(
    '/:id',
    protect,
    auth('admin'),
    multerUpload.single('banner'),
    asyncHandler(bannerController.updateBanner),
);

export default bannerRouter;
