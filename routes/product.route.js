import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect, auth } from '../middleware/auth.middleware.js';
import productController from '../controllers/product.controller.js';
import { multerUpload } from '../utils/multer.js';
import validate from '../middleware/validate.middleware.js';

const productRouter = express.Router();
productRouter.get('/slug/:slug', asyncHandler(productController.getProductBySlug));
productRouter.get('/admin', protect, auth('staff', 'admin'), asyncHandler(productController.getAllProductsByAdmin));
productRouter.get('/recommend', asyncHandler(productController.getProductRecommend));
productRouter.get('/:id', validate.getProductById, asyncHandler(productController.getProductById));
productRouter.get('/', asyncHandler(productController.getProducts));
productRouter.post(
    '/',
    validate.createProduct,
    protect,
    auth('staff', 'admin'),
    multerUpload.array('productImage'),
    asyncHandler(productController.createProduct),
);
productRouter.post(
    '/:id/review',
    validate.review,
    protect,
    auth('customer'),
    asyncHandler(productController.reviewProduct),
);
productRouter.put(
    '/:id',
    validate.updateProduct,
    protect,
    auth('staff', 'admin'),
    multerUpload.array('productImage'),
    asyncHandler(productController.updateProduct),
);
productRouter.patch(
    '/:id/hide',
    validate.hide,
    protect,
    auth('staff', 'admin'),
    asyncHandler(productController.hideProduct),
);
productRouter.patch(
    '/:id/unhide',
    validate.unhide,
    protect,
    auth('staff', 'admin'),
    asyncHandler(productController.unhideProduct),
);
productRouter.patch(
    '/:id/restore',
    validate.restore,
    protect,
    auth('staff', 'admin'),
    asyncHandler(productController.restoreProduct),
);
productRouter.delete(
    '/:id',
    validate.delete,
    protect,
    auth('staff', 'admin'),
    asyncHandler(productController.deleteProduct),
);
export default productRouter;
