import * as fs from 'fs';
import Banner from '../models/banner.model.js';
import { cloudinaryUpload, cloudinaryRemove } from '../utils/cloudinary.js';
import { validationResult } from 'express-validator';
import { ObjectId } from 'mongodb';

const getBanners = async (req, res) => {
    const banners = await Banner.find({ role: 'banner' }).sort({ index: 1 });
    const sliders = await Banner.find({ role: 'slider' }).sort({ index: 1 });
    return res.status(200).json({ success: true, message: '', data: { banners, sliders } });
};

const getBannerById = async (req, res) => {
    const bannerId = req.params.id || null;
    if (!ObjectId.isValid(bannerId)) {
        res.status(400);
        throw new Error('ID is not valid');
    }
    const banner = await Banner.findOne({ _id: bannerId });
    if (!banner) {
        res.status(404);
        throw new Error('Banner not found');
    }
    return res.status(200).json({ success: true, message: '', data: { banner } });
};

const createBanner = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'An error occurred', ...errors });
    }
    const { title, index, imageUrl, linkTo, role } = req.body;

    let image = '';

    if (req.file) {
        const uploadImage = await cloudinaryUpload(req.file.path, 'FashtionShop/banners');
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
        const uploadImage = await cloudinaryUpload(imageUrl, 'FashtionShop/banners');
        if (!uploadImage) {
            throw new Error('Some banners were not uploaded due to an unknown error');
        }
        image = uploadImage.secure_url;
    } else {
        res.status(400);
        throw new Error('Banner image is required');
    }

    const banner = new Banner({
        title,
        index,
        imageUrl: image,
        linkTo,
        role,
    });
    const newBanner = await banner.save();
    return res.status(201).json({ success: true, message: 'Banners are added', data: { newBanner } });
};

const updateBanner = async (req, res) => {
    const errors = validationResult(req.body);
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
    const bannerId = req.params.id || null;
    if (!ObjectId.isValid(bannerId)) {
        res.status(400);
        throw new Error('ID is not valid');
    }
    const banner = await Banner.findById(bannerId);
    if (!banner) {
        return res.status(404).json({ success: true, message: 'Banner not found' });
    }

    const { title, imageUrl, linkTo } = req.body;
    let image = imageUrl || '';
    if (image.trim() == '') {
        if (req.file) {
            const uploadImage = await cloudinaryUpload(req.file.path, 'FashtionShop/banners');
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
        } else {
            res.status(400);
            throw new Error('Banner image is required');
        }
    }

    const publicId = banner.url.split('.').pop();
    await cloudinaryRemove(publicId);

    banner.title = title;
    banner.imageUrl = image;
    banner.linkTo = linkTo;
    const updateBanner = await banner.save();
    res.status(200).json({ success: true, message: '', data: { updateBanner } });
};

const deleteBanner = async (req, res) => {
    const deletedBanner = await Banner.findByIdAndDelete(req.params.id);
    if (!deletedBanner) {
        res.status(404);
        throw new Error('Banner not found');
    }
    const publicId = deletedBanner.url.split('.').pop();
    await cloudinaryRemove(publicId);
    res.status(200).json({ success: true, message: 'Banner is deleted' });
};

const bannerController = {
    getBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
};
export default bannerController;
