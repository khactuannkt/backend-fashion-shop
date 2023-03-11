import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect, auth } from '../middleware/auth.middleware.js';
import productController from '../controllers/product.controller.js';
import { multerUpload } from '../utils/multer.js';
import validate from '../middleware/validate.middleware.js';

const productRouter = express.Router();
productRouter.get('/admin', protect, auth('staff', 'admin'), asyncHandler(productController.getAllProductsByAdmin));
productRouter.get('/recommend', asyncHandler(productController.getProductSearchResults));
productRouter.get('/:id', asyncHandler(productController.getProductById));
productRouter.get('/', asyncHandler(productController.getProducts));
productRouter.get('/slug/:slug', asyncHandler(productController.getProductById));
productRouter.post(
    '/',
    validate.createProduct,
    protect,
    auth('staff', 'admin'),
    multerUpload.array('productImage'),
    asyncHandler(productController.createProduct),
);
productRouter.post('/:id/review', protect, auth('customer'), asyncHandler(productController.reviewProduct));
productRouter.put(
    '/:id',
    protect,
    auth('admin'),
    multerUpload.array('productImage'),
    asyncHandler(productController.updateProduct),
);
productRouter.patch('/:id/disable', protect, auth('staff', 'admin'), asyncHandler(productController.reviewProduct));
productRouter.patch('/:id/restore', protect, auth('staff', 'admin'), asyncHandler(productController.reviewProduct));
productRouter.delete('/:id', protect, auth('staff', 'admin'), asyncHandler(productController.deleteProduct));
export default productRouter;
