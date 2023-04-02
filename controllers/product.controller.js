import * as fs from 'fs';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Order from '../models/order.model.js';
import Cart from '../models/cart.model.js';
import Variant from '../models/variant.model.js';
import { productQueryParams, validateConstants, priceRangeFilter, ratingFilter } from '../utils/searchConstants.js';
import { cloudinaryUpload, cloudinaryRemove } from '../utils/cloudinary.js';
import { validationResult } from 'express-validator';
import slug from 'slug';
import difference from 'lodash.difference';
import differenceBy from 'lodash.differenceby';
import { url } from 'inspector';

const getProducts = async (req, res) => {
    // const limit = Number(req.query.limit) || 12;
    // const rating = Number(req.query.rating) || 0;
    // const maxPrice = Number(req.query.maxPrice) || 0;
    // const minPrice = Number(req.query.minPrice) || 0;
    // const Sort = validateConstants(productQueryParams, 'sort', req.query.sortBy);
    const page = Number(req.query.pageNumber) || 1;

    const pageSize = Number(req.query.pageSize) || 12; //EDIT HERE
    const dateOrderSortBy = validateConstants(productQueryParams, 'date', req.query.dateOrder);
    const priceOrderSortBy = validateConstants(productQueryParams, 'price', req.query.priceOrder);
    const bestSellerSortBy = validateConstants(productQueryParams, 'totalSales', req.query.bestSeller);
    const productSortBy = { ...bestSellerSortBy, ...priceOrderSortBy, ...dateOrderSortBy };
    /* let statusFilter;
    if (!req.user || req.user.isAdmin == false) {
        statusFilter = validateConstants(productQueryParams, 'status', 'default');
    } else if (req.user.isAdmin) {
        statusFilter = validateConstants(productQueryParams, 'status', req.query.status);
    } */
    const keyword = req.query.keyword
        ? {
              name: {
                  $regex: req.query.keyword,
                  $options: 'i',
              },
          }
        : {}; // TODO: return cannot find product

    //Check if category existed
    const categoryId = req.query.category || null;
    const category = await Category.findOne({ _id: categoryId });
    const categoryFilter = category ? { category: category } : {};
    /* if (!req.query.category) {
        categoryName = 'All';
    }
    let categoryIds;
    if (categoryName == 'All') {
        //categoryIds = await Category.find({ ...statusFilter }).select({ _id: 1 });
    } else {
        //categoryIds = await Category.find({ name: categoryName, ...statusFilter }).select({ _id: 1 });
        categoryIds = await Category.find({ name: categoryName }).select({ _id: 1 });
    } */
    //(categoryFilter);
    const productFilter = {
        ...keyword,
        ...categoryFilter,
        ...priceRangeFilter(parseInt(req.query.minPrice), parseInt(req.query.maxPrice)),
        ...ratingFilter(parseInt(req.query.rating)),
    };
    const count = await Product.countDocuments(productFilter);
    //Check if product match keyword
    if (count == 0) {
        res.status(204);
        res.json({ message: 'No products found for this keyword' });
    }
    //else
    const products = await Product.find(productFilter)
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort(productSortBy)
        .populate('category')
        .populate('variants');
    res.json({ products, page, pages: Math.ceil(count / pageSize), totalProducts: count });
};

const getProductRecommend = async (req, res) => {
    const pageSize = Number(req.query.pageSize) || 20; //EDIT HERE
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

const getAllProductsByAdmin = async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    let search = {};
    if (req.query.keyword) {
        search.name = {
            $regex: req.query.keyword,
            $options: 'i',
        };
    }
    if (req.query.category) {
        search.category = req.query.category;
    }
    const count = await Product.countDocuments({ ...search });
    const products = await Product.find({ ...search })
        .populate(`category`)
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });
    res.json({ products, page, pages: Math.ceil(count / pageSize), countProducts: count });
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
    const product = await Product.findById(req.params.id).populate('variants');
    if (!product) {
        res.status(404);
        throw new Error('Sản phẩm không tồn tại');
    }
    res.status(200).json({ data: { product } });
};

const createProduct = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    let { name, description, category, brand, keywords, variants } = req.body;

    const findProduct = Product.findOne({ name });
    const findCategory = Category.findById(category);
    const [existedProduct, existedCategory] = await Promise.all([findProduct, findCategory]);
    if (existedProduct) {
        res.status(400);
        throw new Error('Tên sản phẩm đã tồn tại');
    }
    if (!existedCategory) {
        res.status(400);
        throw new Error('Thể loại không tồn tại');
    }
    //generate slug
    let generatedSlug = slug(name);
    const existSlug = await Product.findOne({ slug: generatedSlug });
    if (existSlug) {
        generatedSlug = generatedSlug + '-' + Math.round(Math.random() * 10000).toString();
    }
    // upload image to cloundinary
    const images = [];
    if (req.files && req.files.length > 0) {
        const uploadListImage = req.files.map(async (image) => {
            const uploadImage = await cloudinaryUpload(image.path, 'FashionShop/products');
            if (!uploadImage) {
                res.status(500);
                throw new Error('Error while uploading image');
            }
            fs.unlink(image.path, (error) => {
                if (error) {
                    throw new Error(error);
                }
            });
            return uploadImage.secure_url;
        });
        const imageList = await Promise.all(uploadListImage);
        images.push(...imageList);
    }
    if (images.length === 0) {
        res.status(400);
        throw new Error('Thiếu hình ảnh. Vui lòng đăng tải ít nhất 1 hình ảnh');
    }
    const product = new Product({
        name,
        slug: generatedSlug,
        description,
        category,
        images,
        brand,
        keywords,
    });
    // const newProduct = await product.save();
    if (variants && variants.length > 0) {
        const productVariants = variants.map((variant) => {
            return new Variant({ product: product._id, ...variant });
        });
        const createdVariants = await Variant.insertMany(productVariants);
        if (createdVariants.length === 0) {
            res.status(400);
            throw new Error('Thông tin sản phẩm không hợp lệ');
        }
        let minPriceSale = createdVariants[0].priceSale;
        let minPrice = createdVariants[0].price;
        let totalQuantity = 0;
        const variantIds = createdVariants.map((variant) => {
            totalQuantity += variant.quantity;
            if (minPriceSale > variant.priceSale) {
                minPriceSale = variant.priceSale;
                minPrice = variant.price;
            }
            return variant._id;
        });
        product.variants = variantIds;
        product.price = minPrice;
        product.priceSale = minPriceSale;
        product.quantity = totalQuantity;
    }
    const newProduct = await (await product.save()).populate('variants');
    res.status(201).json({ message: 'Thêm sản phẩm thành công', data: { newProduct } });
};

const updateProduct = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }

    const { name, description, category, images, brand, keywords, variants } = req.body;
    // let variants = JSON.parse(req.body.variants);
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
        res.status(404);
        throw new Error('Sản phẩm không tồn tại');
    }

    //update product
    if (currentProduct.name != name) {
        const existedProduct = await Product.findOne({ name });
        if (existedProduct) {
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
            res.status(400);
            throw new Error('Thể loại không tồn tại');
        }
        currentProduct.category = existedCategory._id;
    }
    currentProduct.description = description || currentProduct.description;
    currentProduct.brand = brand || currentProduct.brand;
    currentProduct.keywords = keywords || currentProduct.keywords;

    //update image
    const updateImages = images || [];
    if (req.files && req.files.length > 0) {
        const uploadListImage = req.files.map(async (image) => {
            const uploadImage = await cloudinaryUpload(image.path, 'FashionShop/products');
            if (!uploadImage) {
                res.status(500);
                throw new Error('Error while uploading image');
            }
            fs.unlink(image.path, (error) => {
                if (error) {
                    throw new Error(error);
                }
            });
            return uploadImage.secure_url;
        });
        const imageList = await Promise.all(uploadListImage);
        updateImages.push(...imageList);
    }
    if (updateImages.length === 0) {
        res.status(400);
        throw new Error('Thiếu hình ảnh. Vui lòng đăng tải ít nhất 1 hình ảnh');
    }
    const oldImages = currentProduct.images;
    currentProduct.images = updateImages;
    //update variant
    //update current variants
    const oldVariants = currentProduct.variants;
    const variantUpdates = variants.map(async (variant) => {
        if (currentProduct.variants.indexOf(variant._id) != -1) {
            return await Variant.findByIdAndUpdate(variant._id, { ...variant }, { new: true });
        } else {
            const newVariant = new Variant({
                product: currentProduct._id,
                ...variant,
            });
            return await newVariant.save();
        }
    });
    const updateVariants = await Promise.all(variantUpdates);
    //recalculate product price and total quantity
    let minPriceSale = updateVariants[0].priceSale;
    let minPrice = updateVariants[0].price;
    let totalQuantity = 0;
    const variantIds = updateVariants.map((variant) => {
        totalQuantity += variant.quantity;
        if (minPriceSale > variant.priceSale) {
            minPriceSale = variant.priceSale;
            minPrice = variant.price;
        }
        return variant._id;
    });
    currentProduct.variants = variantIds;
    currentProduct.price = minPrice;
    currentProduct.priceSale = minPriceSale;
    currentProduct.quantity = totalQuantity;

    const updatedProduct = await currentProduct.save();
    const compareVariants = differenceBy(oldVariants, updatedProduct.variants, '_id');
    //Check the difference of 2 arrays
    const compareImages = difference(oldImages, updatedProduct.images);
    if (compareImages.length > 0) {
        compareImages.map((image) => {
            const publicId = image.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
            cloudinaryRemove('FashionShop/products/' + publicId);
        });
    }
    if (compareVariants.length > 0) {
        compareVariants.map((variant) => {
            if (variant.image) {
                const publicId = variant.image.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
                cloudinaryRemove('FashionShop/products/' + publicId);
            }
        });
        await Variant.deleteMany({ _id: { $in: compareVariants } });
    }
    res.status(200).json({ message: 'Cập nhật Sản phẩm thành công', data: { updatedProduct } });
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
    getProducts,
    getProductRecommend,
    getAllProductsByAdmin,
    createProduct,
    updateProduct,
    reviewProduct,
    hideProduct,
    unhideProduct,
    restoreProduct,
    deleteProduct,
};
export default productController;
