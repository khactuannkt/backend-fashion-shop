import Category from '../models/category.model.js';
import Product from '../models/product.model.js';
import { check, validationResult } from 'express-validator';
import { cloudinaryUpload, cloudinaryRemove } from '../utils/cloudinary.js';
import { ObjectId } from 'mongodb';
const getCategories = async (req, res) => {
    const level = req.query.level;
    const filter = {};
    if (level) {
        filter.level = level;
    }
    const categories = await Category.find(filter).sort({ _id: -1 });
    return res.json({ message: 'Success', data: { categories } });
};
const getCategoryTree = async (req, res) => {
    const categories = await Category.find({ level: 1 }).populate('children').sort({ _id: -1 });
    return res.json({ message: 'Success', data: { categories } });
};
const getCategoryById = async (req, res, next) => {
    const categoryId = req.params.id || null;
    if (!ObjectId.isValid(categoryId)) {
        res.status(400);
        throw new Error('ID is not valid');
    }
    const category = await Category.findById(categoryId).populate('children', 'parent');
    if (category) {
        return res.json({ message: 'Success', data: { category: category } });
    } else {
        res.status(404);
        throw new Error('Danh mục không tồn tại');
    }
};
const createCategory = async (req, res, next) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const { name, image, level, parent } = req.body;

    const categoryExists = await Category.findOne({ name: name.trim() });
    if (categoryExists) {
        res.status(409);
        throw new Error('Danh mục đã tồn tại');
    }

    const category = new Category({
        name: name.trim(),
        level: level,
    });
    let parentCat;
    if (category.level > 1) {
        if (!parent || parent.trim() === '') {
            res.status(400);
            throw new Error('Nếu danh mục có cấp độ lớn hơn 1 thì phải chọn danh mục mẹ');
        }
        if (!ObjectId.isValid(parent)) {
            res.status(400);
            throw new Error('ID danh mục mẹ không hợp lệ');
        }
        parentCat = await Category.findById(parent);
        if (!parentCat) {
            res.status(404);
            throw new Error('Danh mục mẹ không tồn tại');
        }
        if (parentCat.level >= category.level) {
            res.status(400);
            throw new Error('Danh mục mẹ phải có cấp độ nhỏ hơn cấp độ danh mục muốn tạo');
        }
        category.parent = parentCat._id;
        parentCat.children.push(category._id);
    } else {
        category.parent = category._id;
    }
    let imageUrl = '';
    if (req.file) {
        const uploadImage = await cloudinaryUpload(req.file.path, 'FashionShop/categories');
        if (!uploadImage) {
            throw new Error('Some category image were not uploaded due to an unknown error');
        }
        imageUrl = uploadImage.secure_url;
        fs.unlink(req.file.path, (error) => {
            if (error) {
                res.status(500);
                throw new Error(error);
            }
        });
    } else if (image && image.trim() !== '') {
        const uploadImage = await cloudinaryUpload(image, 'FashionShop/categories');
        if (!uploadImage) {
            throw new Error('Some category image were not uploaded due to an unknown error');
        }
        imageUrl = uploadImage.secure_url;
    }
    if (imageUrl.length > 0) {
        category.image = imageUrl;
    }
    const newCategory = await category.save();
    if (parentCat) {
        await parentCat.save();
    }
    res.status(201).json({ message: 'Thêm danh mục thành công', data: { newCategory } });
};

const updateCategory = async (req, res, next) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const categoryId = req.params.id || null;

    //find category by id
    const currentCategory = await Category.findById(categoryId);
    if (!currentCategory) {
        res.status(404);
        throw new Error('Danh mục không tồn tại');
    }
    const { name, level, image, parent } = req.body;
    let newParentCat, currentParentCat;

    if (currentCategory.name !== name) {
        //check the existence of the category
        const categoryExists = await Category.findOne({ name: name.trim() });
        if (categoryExists && categoryExists.name != currentCategory.name) {
            res.status(409);
            throw new Error('Danh mục đã tồn tại');
        }
        currentCategory.name = name.trim();
    }

    if (currentCategory.parent != parent || currentCategory.level != level) {
        currentCategory.level = level || currentCategory.level;

        // check parent category
        newParentCat = await Category.findById(parent);
        if (!newParentCat) {
            res.status(404);
            throw new Error('Danh mục mẹ không tồn tại');
        }

        if (
            newParentCat.level > currentCategory.level ||
            (newParentCat.level == currentCategory.level &&
                (newParentCat._id != currentCategory._id || currentCategory.level > 1))
        ) {
            res.status(400);
            throw new Error('Danh mục mẹ phải có cấp độ nhỏ hơn cấp độ danh mục muốn cập nhật');
        }

        if (currentCategory.parent !== parent) {
            //delete children category in parent category
            currentParentCat = await Category.findById(currentCategory.parent);
            if (currentParentCat) {
                let index = currentParentCat.children.indexOf(currentCategory._id);
                if (index !== -1) {
                    currentParentCat.children.splice(index, 1);
                }
            }
            if (newParentCat._id.toString() != currentCategory._id.toString()) {
                newParentCat.children.push(currentCategory._id);
            }
            currentCategory.parent = newParentCat._id || currentCategory.parent;
        }
    }

    let imageUrl = '';
    if (req.file) {
        const uploadImage = await cloudinaryUpload(req.file.path, 'FashionShop/categories');
        if (!uploadImage) {
            throw new Error('Some category image were not uploaded due to an unknown error');
        }
        imageUrl = uploadImage.secure_url;
        fs.unlink(req.file.path, (error) => {
            if (error) {
                res.status(500);
                throw new Error(error);
            }
        });
    } else if (image && image.trim() !== '' && currentCategory.image !== image) {
        const uploadImage = await cloudinaryUpload(image, 'FashionShop/categories');
        if (!uploadImage) {
            throw new Error('Some category image were not uploaded due to an unknown error');
        }
        imageUrl = uploadImage.secure_url;
    }
    if (imageUrl.length > 0) {
        const publicId = currentCategory.image.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
        await cloudinaryRemove('FashionShop/categories/' + publicId);
        currentCategory.image = imageUrl;
    }

    const updateCategory = await currentCategory.save();
    if (newParentCat) {
        await newParentCat.save();
    }
    if (currentParentCat) {
        await currentParentCat.save();
    }
    res.status(200).json({ message: 'Cập nhật danh mục thành công', data: { updateCategory } });
};
const deleteCategory = async (req, res, next) => {
    const categoryId = req.params.id || null;
    if (!ObjectId.isValid(categoryId)) {
        res.status(400);
        throw new Error('ID danh mục không hợp lệ');
    }
    const category = await Category.findById(categoryId);
    if (!category) {
        res.status(404);
        throw new Error('Danh mục không tồn tại');
    }

    if (category.children.length > 0) {
        res.status(400);
        throw new Error('Danh mục danh tồn tại danh mục con. không thể xóa được');
    }

    const categoryInProduct = await Product.findOne({ category: category._id });
    if (categoryInProduct) {
        res.status(400);
        throw new Error('Đang tồn tại sản phẩm có thể loại là danh mục này. không thể xóa được');
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
    res.status(200).json({ message: 'Xóa danh mục thành công' });
};

const categoryController = {
    createCategory,
    getCategories,
    getCategoryTree,
    getCategoryById,
    updateCategory,
    deleteCategory,
};
export default categoryController;
