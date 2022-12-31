import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect, auth } from '../middlewares/auth.middleware.js';
import productController from '../controllers/product.controller.js';
import { multerUpload } from '../utils/multer.js';

const productRouter = express.Router();

productRouter.get('/ProductAll', asyncHandler(productController.getAllProducts));
productRouter.get('/admin', protect, auth('admin'), asyncHandler(productController.getAllProductsByAdmin));
productRouter.get('/search', asyncHandler(productController.getProductSearchResults));
productRouter.post('/:id/review', protect, auth('user'), asyncHandler(productController.reviewProduct));
productRouter.get('/:id', asyncHandler(productController.getProductById));
productRouter.delete('/:id', protect, auth('admin'), asyncHandler(productController.deleteProduct));
productRouter.put(
    '/:id',
    protect,
    auth('admin'),
    multerUpload.single('productImage'),
    asyncHandler(productController.updateProduct),
);
productRouter.post(
    '/',
    protect,
    auth('admin'),
    multerUpload.single('productImage'),
    asyncHandler(productController.createProduct),
);
productRouter.get('/', asyncHandler(productController.getProducts));
export default productRouter;
