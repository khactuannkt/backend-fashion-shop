import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect, auth } from '../middleware/auth.middleware.js';
import { multerUpload } from '../utils/multer.js';
import bannerController from '../controllers/banner.controller.js';
import validate from '../middleware/validate.middleware.js';

const bannerRouter = express.Router();

bannerRouter.get('/', asyncHandler(bannerController.getBanners));

bannerRouter.get(
    '/:id',
    validate.getBannerById,
    protect,
    auth('staff', 'admin'),
    asyncHandler(bannerController.getBannerById),
);

bannerRouter.post(
    '/',
    validate.createBanner,
    protect,
    auth('staff', 'admin'),
    multerUpload.single('bannerImage'),
    asyncHandler(bannerController.createBanner),
);
bannerRouter.put(
    '/:id',
    validate.updateBanner,
    protect,
    auth('staff', 'admin'),
    multerUpload.single('bannerImage'),
    asyncHandler(bannerController.updateBanner),
);
bannerRouter.delete('/:id', protect, auth('staff', 'admin'), asyncHandler(bannerController.deleteBanner));
// bannerRouter.patch('/:id/increaseIndex', protect, auth('staff', 'admin'), asyncHandler(bannerController.increaseIndex));

// bannerRouter.patch('/:id/decreaseIndex', protect, auth('staff', 'admin'), asyncHandler(bannerController.decreaseIndex));

export default bannerRouter;
