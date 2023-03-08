import Category from '../models/category.model.js';
import Product from '../models/product.model.js';
import { check, validationResult } from 'express-validator';
import { ObjectId } from 'mongodb';
const getCategories = async (req, res, next) => {
    const categories = await Category.find({}).sort({ _id: -1 });
    if (categories) {
        return res.json({ success: true, message: 'Get list of successful categories', data: { categories } });
    } else {
        res.status(404);
        throw new Error('Category not Found');
    }
};
const getCategoryTree = async (req, res, next) => {
    const categories = await Category.find({ level: 1 }).populate('children').sort({ _id: -1 });
    if (categories) {
        return res.json({ success: true, message: 'Get list of successful categories', data: { categories } });
    } else {
        res.status(404);
        throw new Error('Category not Found');
    }
};
const createCategory = async (req, res, next) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().reduce((acc, error) => {
            const { param, msg } = error;
            if (!acc[param]) {
                acc[param] = msg;
            }
            return acc;
        }, {});
        return res.status(400).json({ success: false, message: 'An error occurred', errors: errorMessages });
    }
    const { name, image, level, parent } = req.body;

    const categoryExists = await Category.findOne({ name: name.trim() });
    if (categoryExists) {
        res.status(409);
        throw new Error('This category already exists');
    }

    const category = new Category({
        name: name.trim(),
        image: image,
        level: level,
    });
    let parentCat;
    if (category.level > 1) {
        if (!parent || parent.trim() === '') {
            res.status(400);
            throw new Error('If level is greater than 1 then Parent category is required');
        }
        if (!ObjectId.isValid(parent)) {
            res.status(400);
            throw new Error('Parent category ID is not valid');
        }
        parentCat = await Category.findById(parent);
        if (!parentCat) {
            res.status(404);
            throw new Error('Parent category is not found');
        }
        if (parentCat.level >= category.level) {
            res.status(400);
            throw new Error('Parent category level must be smaller than the category you want to create');
        }
        category.parent = parentCat._id;
        parentCat.children.push(category._id);
    } else {
        category.parent = category._id;
    }
    const newCategory = await category.save();
    if (parentCat) {
        await parentCat.save();
    }
    res.status(201).json({ success: true, message: 'Add successful category', data: { newCategory } });
};

const updateCategory = async (req, res, next) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().reduce((acc, error) => {
            const { param, msg } = error;
            if (!acc[param]) {
                acc[param] = msg;
            }
            return acc;
        }, {});
        return res.status(400).json({ success: false, message: 'An error occurred', errors: errorMessages });
    }
    // Check id
    const categoryId = req.params.id || null;
    if (!ObjectId.isValid(categoryId)) {
        res.status(400);
        throw new Error('ID is not valid');
    }
    //find category by id
    const currentCategory = await Category.findById(categoryId);
    if (!currentCategory) {
        res.status(404);
        throw new Error('Category is not found');
    }
    //check the data change of category
    const { name, level, image, parent } = req.body;
    if (
        currentCategory.name == name.trim() &&
        currentCategory.level == level &&
        currentCategory.image == image.trim() &&
        currentCategory.parent == parent
    ) {
        return res.status(204).json();
    }
    //check the existence of the category
    const categoryExists = await Category.findOne({ name: name.trim() });
    if (categoryExists && categoryExists.name != currentCategory.name) {
        res.status(409);
        throw new Error('This category already exists');
    }
    // check id parent category
    if (!ObjectId.isValid(parent)) {
        res.status(400);
        throw new Error('Parent category ID is not valid');
    }
    // check parent category
    const newParentCat = await Category.findById(parent);
    if (!newParentCat) {
        res.status(404);
        throw new Error('Parent category is not found');
    }
    if (newParentCat._id.toString() != currentCategory._id.toString() && newParentCat.level >= currentCategory.level) {
        res.status(400);
        throw new Error('The parent category level must be smaller than the one you want to update');
    }
    //delete children category in parent category
    const currentParentCat = await Category.findById(currentCategory.parent);
    if (currentParentCat) {
        let index = currentParentCat.children.indexOf(currentCategory._id);
        if (index !== -1) {
            currentParentCat.children.splice(index, 1);
        }
    }
    //update category
    currentCategory.name = name.trim() || currentCategory.name;
    currentCategory.level = level || currentCategory.level;
    currentCategory.image = image.trim() || currentCategory.image;
    currentCategory.parent = newParentCat._id || currentCategory.parent;
    if (newParentCat._id.toString() != currentCategory._id.toString()) {
        newParentCat.children.push(currentCategory._id);
    }
    const updateCategory = await currentCategory.save();
    if (newParentCat._id.toString() != currentCategory._id.toString()) {
        await newParentCat.save();
    }
    if (currentParentCat) {
        await currentParentCat.save();
    }
    res.status(200).json({ success: true, message: 'Category updated successfully', data: { updateCategory } });
};
const deleteCategory = async (req, res, next) => {
    const categoryId = req.params.id || null;
    if (!ObjectId.isValid(categoryId)) {
        res.status(400);
        throw new Error('ID is not valid');
    }
    const category = await Category.findById(categoryId);
    if (!category) {
        res.status(404);
        throw new Error('Category not found');
    }

    if (category.children.length > 0) {
        res.status(400);
        throw new Error('This category has a subcategory tag');
    }

    const categoryInProduct = await Product.findOne({ category: category._id });
    if (categoryInProduct) {
        res.status(400);
        throw new Error('Exit products of category');
    }
    let parentCat;
    if (category.parent && category._id.toString() != category.parent.toString()) {
        parentCat = await Category.findById(category.parent);
        if (parentCat) {
            let index = parentCat.children.indexOf(category._id);
            if (index !== -1) {
                parentCat.children.splice(index, 1);
            }
        }
    }
    await category.remove();
    if (parentCat) {
        await parentCat.save();
    }
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
};

const categoryController = {
    createCategory,
    getCategories,
    getCategoryTree,
    updateCategory,
    deleteCategory,
};
export default categoryController;
