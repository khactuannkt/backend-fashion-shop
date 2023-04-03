import * as fs from 'fs';
import Banner from '../models/banner.model.js';
import { cloudinaryUpload, cloudinaryRemove } from '../utils/cloudinary.js';
import { validationResult } from 'express-validator';
import { ObjectId } from 'mongodb';

const getBanners = async (req, res) => {
    const banners = await Banner.find({ role: 'banner' }).sort({ index: 1 });
    const sliders = await Banner.find({ role: 'slider' }).sort({ index: 1 });
    return res.status(200).json({ message: 'Success', data: { banners, sliders } });
};

const getBannerById = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const banner = await Banner.findOne({ _id: req.params.id });
    if (!banner) {
        res.status(404);
        throw new Error('Banner không tồn tại');
    }
    return res.status(200).json({ message: 'Success', data: { banner } });
};

const createBanner = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const { title, index, imageUrl, linkTo, role } = req.body;

    let image = '';
    if (req.file) {
        const uploadImage = await cloudinaryUpload(req.file.path, 'FashionShop/banners');
        if (!uploadImage) {
            throw new Error('Some banners were not uploaded due to an unknown error');
        }
        image = uploadImage.secure_url;
        fs.unlink(req.file.path, (error) => {
            if (error) {
                res.status(500);
                throw new Error(error);
            }
        });
    } else if (imageUrl && imageUrl.trim() !== '') {
        const uploadImage = await cloudinaryUpload(imageUrl, 'FashionShop/banners');
        if (!uploadImage) {
            throw new Error('Some banners were not uploaded due to an unknown error');
        }
        image = uploadImage.secure_url;
    } else {
        res.status(400);
        throw new Error('Hình ảnh banner là giá trị bắt buộc');
    }

    const banner = new Banner({
        title,
        index: Number(index),
        imageUrl: image,
        linkTo,
        role,
    });
    const newBanner = await banner.save();
    return res.status(201).json({ message: 'Thêm banner thành công', data: { newBanner } });
};

const updateBanner = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }

    const banner = await Banner.findById(req.params.id);
    if (!banner) {
        return res.status(404).json({ message: 'Banner không tồn tại' });
    }

    const { title, imageUrl, linkTo } = req.body;
    let image = '';
    if (req.file) {
        const uploadImage = await cloudinaryUpload(req.file.path, 'FashionShop/banners');
        if (!uploadImage) {
            throw new Error('Some banners were not uploaded due to an unknown error');
        }
        image = uploadImage.secure_url;
        fs.unlink(req.file.path, (error) => {
            if (error) {
                res.status(500);
                throw new Error(error);
            }
        });
    } else if (imageUrl && imageUrl.trim() !== '') {
        if (banner.imageUrl !== imageUrl) {
            const uploadImage = await cloudinaryUpload(imageUrl, 'FashionShop/banners');
            if (!uploadImage) {
                throw new Error('Some banners were not uploaded due to an unknown error');
            }
            image = uploadImage.secure_url;
        } else image = banner.imageUrl;
    } else {
        res.status(400);
        throw new Error('Hình ảnh banner là giá trị bắt buộc');
    }
    if (image !== banner.imageUrl) {
        const publicId = banner.imageUrl.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
        await cloudinaryRemove('FashionShop/banners/' + publicId);
    }

    banner.title = title || banner.title;
    banner.imageUrl = image || banner.imageUrl;
    banner.linkTo = linkTo || banner.linkTo;
    const updateBanner = await banner.save();
    res.status(200).json({ message: 'Cập nhật banner thành công', data: { updateBanner } });
};

const deleteBanner = async (req, res) => {
    const bannerId = req.params.id || null;
    if (!ObjectId.isValid(bannerId)) {
        res.status(400);
        throw new Error('ID không hợp lệ');
    }
    const deletedBanner = await Banner.findByIdAndDelete(req.params.id);
    if (!deletedBanner) {
        res.status(404);
        throw new Error('Banner không tồn tại');
    }
    const publicId = deletedBanner.imageUrl.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
    await cloudinaryRemove('FashionShop/banners/' + publicId);
    res.status(200).json({ message: 'Xóa banner thành công' });
};

const bannerController = {
    getBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
};
export default bannerController;
