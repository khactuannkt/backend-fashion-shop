import * as fs from 'fs';
import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Order from '../models/order.model.js';
import Cart from '../models/cart.model.js';
import Variant from '../models/variant.model.js';
import { productQueryParams, validateConstants, priceRangeFilter, ratingFilter } from '../utils/searchConstants.js';
import { cloudinaryUpload, cloudinaryRemove } from '../utils/cloudinary.js';
import { validationResult } from 'express-validator';
import slug from 'slug';

const getProducts = async (req, res) => {
    const limit = parseInt(req.query.limit) || 12;
    const rating = parseInt(req.query.rating) || 0;
    const maxPrice = parseInt(req.query.maxPrice) || 0;
    const minPrice = parseInt(req.query.minPrice) || 0;
    const page = parseInt(req.query.page) || 0;
    const status = req.query.status || null;

    const sortBy = validateConstants(productQueryParams, 'sort', req.query.sortBy || 'default');

    const keyword = req.query.keyword
        ? {
              $or: [
                  {
                      name: {
                          $regex: req.query.keyword,
                          $options: 'i',
                      },
                  },
                  {
                      keywords: {
                          $elemMatch: {
                              $regex: req.query.keyword,
                              $options: 'i',
                          },
                      },
                  },
              ],
          }
        : {};

    //Check if category existed
    let categoryName = req.query.category || null;
    let categoryIds = [];
    if (!categoryName) {
        categoryIds = await Category.find({ disabled: false }).select({ _id: 1 });
    } else {
        const findCategory = await Category.findOne({ _id: categoryName, disabled: false }).select({
            _id: 1,
            children: 1,
        });
        if (findCategory) {
            categoryIds.push(findCategory._id, ...findCategory.children);
        }
    }
    const categoryFilter = categoryIds.length > 0 ? { category: categoryIds } : {};

    const productFilter = {
        ...keyword,
        ...categoryFilter,
        ...priceRangeFilter(minPrice, maxPrice),
        ...ratingFilter(rating),
    };
    const count = await Product.countDocuments(productFilter);
    //Check if product match keyword
    if (count == 0) {
        res.status(204);
        throw new Error('Không có sản phẩm nào!');
    }
    //else
    const products = await Product.find(productFilter)
        .limit(limit)
        .skip(limit * page)
        .sort(sortBy)
        .populate('category')
        .populate('variants');

    res.status(200).json({
        message: 'Success',
        data: { products, page, pages: Math.ceil(count / limit), total: count },
    });
};

const getProductsByAdmin = async (req, res) => {
    const limit = parseInt(req.query.limit) || 12;
    const rating = parseInt(req.query.rating) || 0;
    const maxPrice = parseInt(req.query.maxPrice) || 0;
    const minPrice = parseInt(req.query.minPrice) || 0;
    const page = parseInt(req.query.page) || 0;
    const status = req.query.status || null;
    let sortBy = req.query.sortBy || null;
    sortBy = validateConstants(productQueryParams, 'sort', sortBy ? sortBy : 'newest');
    let statusFilter = validateConstants(productQueryParams, 'status', status);

    const keyword = req.query.keyword
        ? {
              $or: [
                  {
                      name: {
                          $regex: req.query.keyword,
                          $options: 'i',
                      },
                  },
                  {
                      keywords: {
                          $elemMatch: {
                              $regex: req.query.keyword,
                              $options: 'i',
                          },
                      },
                  },
              ],
          }
        : {};

    //Check if category existed
    let categoryName = req.query.category || null;
    let categoryIds = [];
    if (!categoryName) {
        categoryIds = await Category.find({ disabled: false }).select({ _id: 1 });
    } else {
        const findCategory = await Category.findOne({ _id: categoryName, disabled: false }).select({
            _id: 1,
            children: 1,
        });
        if (findCategory) {
            categoryIds.push(findCategory._id, ...findCategory.children);
        }
    }
    const categoryFilter = categoryIds.length > 0 ? { category: categoryIds } : {};

    const productFilter = {
        ...keyword,
        ...categoryFilter,
        ...statusFilter,
        ...priceRangeFilter(minPrice, maxPrice),
        ...ratingFilter(rating),
    };
    const count = await Product.countDocuments(productFilter);
    //Check if product match keyword
    if (count == 0) {
        res.status(204);
        throw new Error('Không có sản phẩm nào!');
    }
    //else
    const products = await Product.find(productFilter)
        .limit(limit)
        .skip(limit * page)
        .sort(sortBy)
        .populate('category')
        .populate('variants');

    res.status(200).json({
        message: 'Success',
        data: { products, page, pages: Math.ceil(count / limit), total: count },
    });
};
const getProductSearchResults = async (req, res) => {
    const limit = Number(req.query.limit) || 12; //EDIT HERE
    const keyword = req.query.keyword
        ? {
              name: {
                  $regex: req.query.keyword,
                  $options: 'i',
              },
          }
        : {};
    const productFilter = {
        ...keyword,
    };
    const products = await Product.find(productFilter).limit(pageSize).select('name');
    res.status(200);
    res.json(products);
};
const getProductRecommend = async (req, res) => {
    const limit = Number(req.query.limit) || 12; //EDIT HERE

    const products = await Product.find(productFilter).limit(limit);
    res.status(200);
    res.json({ message: 'Success', data: { products } });
};

const getAllProductsByAdmin = async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ message: 'Success', data: { products } });
};

const getProductBySlug = async (req, res) => {
    const slug = req.params.slug.toString().trim() || '';
    const product = await Product.findOne({ slug: slug }).populate('variants');
    if (!product) {
        res.status(404);
        throw new Error('Sản phẩm không tồn tại');
    }
    res.status(200).json({ data: { product } });
};

const getProductById = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const product = await Product.findOne({ _id: req.params.id }).populate('variants');
    if (!product) {
        res.status(404);
        throw new Error('Sản phẩm không tồn tại');
    }
    res.status(200).json({ data: { product } });
};

const createProduct = async (req, res, next) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.files && req.files.length > 0) {
            await req.files.map(async (image) => {
                fs.unlink(image.path, (error) => {
                    if (error) {
                        throw new Error(error);
                    }
                });
            });
        }
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    let { name, description, category, brand, weight, length, height, width } = req.body;
    const variants = JSON.parse(req.body.variants) || [];
    const keywords = JSON.parse(req.body.keywords) || [];
    const imageFile = req.body.imageFile ? JSON.parse(req.body.imageFile) : [];

    const findProduct = Product.findOne({ name });
    const findCategory = Category.findOne({ _id: category });
    const [existedProduct, existedCategory] = await Promise.all([findProduct, findCategory]);
    if (existedProduct) {
        res.status(400);
        throw new Error('Tên sản phẩm đã tồn tại');
    }
    if (!existedCategory) {
        res.status(400);
        throw new Error('Thể loại không tồn tại');
    }

    const variantsValue = {};
    variants.map((variant) => {
        variant.attributes.map((attr) => {
            if (!variantsValue[`${attr.name}`]) {
                variantsValue[`${attr.name}`] = [];
            }
            variantsValue[`${attr.name}`].push(attr.value);
        });
    });
    const countVariant = Object.keys(variantsValue).reduce((accumulator, key) => {
        const variantsSet = new Set(variantsValue[key]);
        return accumulator * variantsSet.size;
    }, 1);
    if (countVariant < variants.length) {
        res.status(400);
        throw new Error('Giá trị của các biến thể không được trùng nhau');
    }
    //generate slug
    let generatedSlug = slug(name);
    const existSlug = await Product.findOne({ slug: generatedSlug });
    if (existSlug) {
        generatedSlug = generatedSlug + '-' + Math.round(Math.random() * 10000).toString();
    }

    const session = await mongoose.startSession();
    const transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
    };
    try {
        await session.withTransaction(async () => {
            const product = new Product({
                name,
                slug: generatedSlug,
                description,
                category,
                weight,
                length,
                height,
                width,
                brand,
                keywords,
            });
            if (variants && variants.length > 0) {
                let totalQuantity = 0;
                let minPriceSale = variants[0].priceSale;
                let minPrice = variants[0].price;

                const variantIds = [];
                const createVariant = variants.map(async (variant) => {
                    totalQuantity += Number(variant.quantity);
                    if (minPriceSale > variant.priceSale) {
                        minPriceSale = variant.priceSale;
                        minPrice = variant.price;
                    }
                    const newVariant = new Variant({ product: product._id, ...variant });
                    await newVariant.save({ session });
                    variantIds.push(newVariant._id);
                });
                await Promise.all(createVariant);

                // upload image to cloundinary
                const images = [];
                if (imageFile && imageFile.length > 0) {
                    const uploadListImage = imageFile.map(async (image) => {
                        const uploadImage = await cloudinaryUpload(image, 'FashionShop/products');
                        if (!uploadImage) {
                            res.status(502);
                            throw new Error('Xảy ra lỗi trong quá trình đăng tải hình ảnh sản phẩm');
                        }
                        return uploadImage.secure_url;
                    });
                    const imageList = await Promise.all(uploadListImage);
                    images.push(...imageList);
                }
                if (images.length === 0) {
                    res.status(400);
                    throw new Error('Thiếu hình ảnh. Vui lòng đăng tải ít nhất 1 hình ảnh');
                }
                product.images = images;
                product.variants = variantIds;
                product.price = minPrice;
                product.priceSale = minPriceSale;
                product.quantity = totalQuantity;
            }
            const newProduct = await (await product.save({ session })).populate('variants');

            res.status(201).json({ message: 'Thêm sản phẩm thành công', data: { newProduct } });
        }, transactionOptions);
    } catch (error) {
        next(error);
    } finally {
        session.endSession();
    }
};

const updateProduct = async (req, res, next) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.files && req.files.length > 0) {
            await req.files.map(async (image) => {
                fs.unlink(image.path, (error) => {
                    if (error) {
                        throw new Error(error);
                    }
                });
            });
        }
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }

    const { name, description, category, brand, weight, length, height, width } = req.body;

    const variants = JSON.parse(req.body.variants) || [];
    const keywords = JSON.parse(req.body.keywords) || [];
    const images = JSON.parse(req.body.images) || [];
    const imageFile = req.body.imageFile ? JSON.parse(req.body.imageFile) : [];
    //Check variants value
    const variantsValue = {};
    let count = 0;
    variants.map((variant) => {
        if (variant.status != -1) {
            variant.attributes.map((attr) => {
                if (!variantsValue[`${attr.name}`]) {
                    variantsValue[`${attr.name}`] = [];
                }
                variantsValue[`${attr.name}`].push(attr.value);
            });
            count++;
        }
    });
    const countVariant = Object.keys(variantsValue).reduce((accumulator, key) => {
        const variantsSet = new Set(variantsValue[key]);
        return accumulator * variantsSet.size;
    }, 1);
    if (countVariant < count) {
        res.status(400);
        throw new Error('Giá trị của các biến thể không được trùng nhau');
    }

    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
        res.status(404);
        throw new Error('Sản phẩm không tồn tại');
    }

    const session = await mongoose.startSession();
    const transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
    };
    try {
        await session.withTransaction(async () => {
            //update product
            if (currentProduct.name != name) {
                const existedProduct = await Product.findOne({ name });
                if (existedProduct) {
                    await session.abortTransaction();
                    res.status(400);
                    throw new Error('Tên sản phẩm đã tồn tại');
                }
                currentProduct.name = name;
                //generate slug
                let generatedSlug = slug(name);
                const existSlug = await Product.findOne({ slug: generatedSlug });
                if (existSlug) {
                    generatedSlug = generatedSlug + '-' + Math.round(Math.random() * 10000).toString();
                }
                currentProduct.slug = generatedSlug;
            }
            if (currentProduct.category != category) {
                const existedCategory = await Category.findById(category);
                if (!existedCategory) {
                    await session.abortTransaction();
                    res.status(400);
                    throw new Error('Thể loại không tồn tại');
                }
                currentProduct.category = existedCategory._id;
            }
            currentProduct.description = description || currentProduct.description;
            currentProduct.brand = brand || currentProduct.brand;
            currentProduct.keywords = keywords || currentProduct.keywords;

            // upload image to cloundinary
            const updateImages = images || [];
            if (imageFile && imageFile.length > 0) {
                const uploadListImage = imageFile.map(async (image) => {
                    console.log(typeof image);
                    const uploadImage = await cloudinaryUpload(image, 'FashionShop/products');
                    if (!uploadImage) {
                        res.status(502);
                        throw new Error('Xảy ra lỗi trong quá trình đăng tải hình ảnh sản phẩm');
                    }
                    return uploadImage.secure_url;
                });
                const imageList = await Promise.all(uploadListImage);
                updateImages.push(...imageList);
            }
            if (updateImages.length === 0) {
                await session.abortTransaction();
                res.status(400);
                throw new Error('Thiếu hình ảnh. Vui lòng đăng tải ít nhất 1 hình ảnh của sản phẩm');
            }
            currentProduct.images = updateImages;
            //update variant
            const oldVariantsId = currentProduct.variants;

            const updateVariantsId = [];
            let totalQuantity = 0;
            let minPriceSale = 0;
            let minPrice = 0;
            const variantUpdates = variants.map(async (variant) => {
                if (variant.status == 1 || variant.status == 0) {
                    if (minPrice == 0) {
                        minPrice = variant.price;
                    }
                    if (minPriceSale == 0) {
                        minPriceSale = variant.priceSale;
                    }
                    totalQuantity += variant.quantity;
                    if (!variant.priceSale) {
                        variant.priceSale = variant.price;
                    }
                    if (minPriceSale > variant.priceSale) {
                        minPriceSale = variant.priceSale;
                        minPrice = variant.price;
                    }
                    if (variant.status == 1) {
                        const newVariant = new Variant({
                            product: currentProduct._id,
                            ...variant,
                        });
                        await newVariant.save({ session });
                        updateVariantsId.push(newVariant._id);
                    } else if (oldVariantsId.indexOf(variant._id) != -1) {
                        const variantUpdate = await Variant.findById(variant._id);
                        if (!variantUpdate) {
                            await session.abortTransaction();
                            res.status(404);
                            throw new Error(`Mã biến thể"${variant._id}" cần cập nhật không tồn tại`);
                        } else {
                            variantUpdate.attributes = variant.attributes || variantUpdate.attributes;
                            variantUpdate.price = variant.price || variantUpdate.price;
                            variantUpdate.priceSale = variant.priceSale || variantUpdate.priceSale;
                            // variantUpdate.image = variant.image || variantUpdate.image;
                            variantUpdate.quantity = variant.quantity || variantUpdate.quantity;
                            await variantUpdate.save({ session });
                            updateVariantsId.push(variantUpdate._id);
                        }
                    }
                } else if (variant.status == -1) {
                    if (oldVariantsId.indexOf(variant._id) != -1) {
                        const variantUpdate = await Variant.findById(variant._id);
                        if (!variantUpdate) {
                            await session.abortTransaction();
                            res.status(404);
                            throw new Error(`Mã biến thể"${variant._id}" cần xóa không tồn tại`);
                        }
                        await variantUpdate.remove({ session });
                    } else {
                        await session.abortTransaction();
                        res.status(400);
                        throw new Error(
                            `Mã biến thể "${variant._id}" cần xóa không thuộc danh sách các biến thể của sản phẩm này`,
                        );
                    }
                } else {
                    await session.abortTransaction();
                    res.status(400);
                    throw new Error('Tồn tại biến thể sản phẩm không hợp lệ');
                }
            });
            await Promise.all(variantUpdates);
            currentProduct.variants = updateVariantsId;
            currentProduct.price = minPrice;
            currentProduct.priceSale = minPriceSale;
            currentProduct.quantity = totalQuantity;
            currentProduct.weight = weight;
            currentProduct.length = length;
            currentProduct.height = height;
            currentProduct.width = width;

            const updatedProduct = await (await currentProduct.save({ session })).populate(['variants', 'category']);

            res.status(200).json({ message: 'Cập nhật Sản phẩm thành công', data: { updatedProduct } });
        }, transactionOptions);
    } catch (error) {
        next(error);
    } finally {
        session.endSession();
    }
};

const reviewProduct = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }

    const { rating, comment } = req.body;
    const productId = req.params.id;
    const product = await Product.findOne({ _id: productId });
    if (!product) {
        res.status(404);
        throw new Error('Sản phẩm không tồn tại');
    }
    const order = await Order.findOne({
        user: req.user._id,
        'orderItems.product': product._id,
        'orderItems.isAbleToReview': true,
        'orderItems.statusHistory.status': 'completed',
    });
    if (!order) {
        res.status(400);
        throw new Error('Bạn cần mua sản phẩm này để có thể đánh giá nó');
    }
    const review = {
        name: req.user.name,
        rating: Number(rating),
        comment: String(comment),
        user: req.user._id,
    };
    product.reviews.push(review);
    product.rating =
        product.reviews.reduce((previousValue, currentReview) => previousValue + currentReview.rating, 0) /
        product.reviews.length;
    const reviewOrderIndex = order.orderItems.findIndex((orderItem) => {
        return orderItem.product.toString() == product._id.toString();
    });
    if (reviewOrderIndex != -1) {
        order.orderItems[reviewOrderIndex].isAbleToReview = false;
        await Promise.all([product.save(), order.save()]);
    } else {
        await product.save();
    }
    res.status(201).json({ message: 'Đánh giá thành công' });
};
const hideProduct = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const productId = req.params.id || null;
    const disabledProduct = await Product.findIdAndUpdate({ _id: productId }, { disabled: true });
    if (!disabledProduct) {
        res.status(404);
        throw new Error('Sản phẩm không tồn tại!');
    }
    const disabledVariant = await Variant.updateMany({ product: productId }, { $set: { disabled: true } });

    res.status(200).json({ message: 'Ẩn sản phẩm thành công' });
};
const unhideProduct = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const productId = req.params.id || null;
    const disabledProduct = await Product.findIdAndUpdate({ _id: productId }, { disabled: false });
    if (!disabledProduct) {
        res.status(404);
        throw new Error('Sản phẩm không tồn tại!');
    }
    const disabledVariant = await Variant.updateMany({ product: productId }, { $set: { disabled: false } });

    res.status(200).json({ message: 'Bỏ ẩn sản phẩm thành công' });
};
const restoreProduct = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const productId = req.params.id || null;
    const deletedProduct = await Product.findByIdAndUpdate(productId, { deleted: null });
    if (!deletedProduct) {
        res.status(404);
        throw new Error('Sản phẩm không tồn tại');
    }
    const deletedVariant = await Variant.updateMany({ product: productId }, { $set: { deleted: null } });
    res.status(200).json({
        message: 'Khôi phục sản phẩm thành công',
    });
};
const deleteProduct = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const productId = req.params.id || null;
    const deletedProduct = await Product.findByIdAndUpdate(productId, { deleted: new Date() });
    if (!deletedProduct) {
        res.status(404);
        throw new Error('Sản phẩm không tồn tại');
    }
    const deletedVariant = await Variant.updateMany({ product: productId }, { $set: { deleted: new Date() } });
    res.status(200).json({
        message:
            'Xóa sản phẩm thành công. Bạn có thể khôi phục trong vòng 30 ngày trước khi sản phẩm này bị xóa hoàn toàn',
    });
};

const productController = {
    getProductBySlug,
    getProductById,
    getProductSearchResults,
    getProducts,
    getProductRecommend,
    getAllProductsByAdmin,
    getProductsByAdmin,
    createProduct,
    updateProduct,
    reviewProduct,
    hideProduct,
    unhideProduct,
    restoreProduct,
    deleteProduct,
};
export default productController;
