import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect, auth } from '../middleware/auth.middleware.js';
import categoryController from '../controllers/category.controller.js';
import validate from '../middleware/validate.middleware.js';

const categoryRouter = express.Router();

categoryRouter.get('/get_category_tree', asyncHandler(categoryController.getCategoryTree));
categoryRouter.get('/', asyncHandler(categoryController.getCategories));
categoryRouter.post(
    '/',
    validate.createCategory,
    protect,
    auth('staff', 'admin'),
    asyncHandler(categoryController.createCategory),
);
categoryRouter.put(
    '/:id',
    validate.updateCategory,
    protect,
    auth('staff', 'admin'),
    asyncHandler(categoryController.updateCategory),
);
categoryRouter.delete('/:id', protect, auth('staff', 'admin'), asyncHandler(categoryController.deleteCategory));

export default categoryRouter;
