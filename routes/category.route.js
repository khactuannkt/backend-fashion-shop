import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect, auth } from '../middlewares/auth.middleware.js';
import categoryController from '../controllers/category.controller.js';

const categoryRouter = express.Router();

categoryRouter.get('/', asyncHandler(categoryController.getCategories));
categoryRouter.delete('/:id', protect, auth('admin'), asyncHandler(categoryController.deleteCategory));
categoryRouter.post('/', protect, auth('admin'), asyncHandler(categoryController.createCategory));
categoryRouter.put('/', protect, auth('admin'), asyncHandler(categoryController.updateCategory));

export default categoryRouter;
