import * as fs from 'fs';
import Banner from '../models/banner.model.js';
import { cloudinaryUpload, cloudinaryRemove } from '../utils/cloudinary.js';

const getBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ role: 'banner' }).sort({ index: 1 });
        res.status(200);
        res.json({ success: true, message: '', banners });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getSliders = async (req, res) => {
    try {
        const sliders = await Banner.find({ role: 'slider' }).sort({ index: 1 });
        res.status(200);
        res.json({ success: true, message: '', sliders });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getBannerById = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            throw new Error('Banner not found');
        }
        return res.status(200).json({ success: true, message: '', banner });
    } catch (error) {
        return res.status(404).json({ success: false, message: error.message });
    }
};

const createBanners = async (req, res) => {
    if (
        !req.files ||
        req.files.length === 0 ||
        !req.title ||
        req.title.trim() === '' ||
        !req.imageUrl ||
        req.imageUrl.trim() === '' ||
        !req.role ||
        req.role.trim() === ''
    ) {
        return res.status(400).json({ success: false, message: 'Banner information is not provided enough' });
    }
    try {
        const uploadImages = req.files.map(async (file) => {
            const image = await cloudinaryUpload(file.path, 'FashtionShop/banners');
            if (!image) {
                throw new Error('Some banners were not uploaded due to an unknown error');
            }
            fs.unlink(file.path, (error) => {
                if (error) {
                    throw new Error(error);
                }
            });
            const banner = new Banner({
                title: req.title,
                imageUrl: image.secure_url,
                linkTo: req.linkTo || '',
                role: req.role,
            });
            return banner.save();
        });
        await Promise.all(uploadImages);
        return res.status(201).json({ success: true, message: 'Banners are added' });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ success: true, message: 'Banner not found' });
        }
        if (!req.file) {
            return res.status(400).json({ success: true, message: 'Image not provided' });
        }
        const image = await cloudinaryUpload(req.file.path);
        if (!image) {
            throw new Error('Error while uploading image');
        }
        const publicId = banner.url.split('.').pop();
        const removeOldImageCloudinary = cloudinaryRemove(publicId);
        const removeNewImageLocal = fs.promises.unlink(req.file.path);
        banner.url = image.secure_url.toString();
        const [newSlider, ...rest] = await Promise.all([banner.save(), removeOldImageCloudinary, removeNewImageLocal]);
        res.status(200);
        res.json(newSlider);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteBanner = async (req, res) => {
    const deletedSlider = await Banner.findByIdAndDelete(req.params.id);
    if (!deletedSlider) {
        res.status(404);
        throw new Error('Slider not found');
    }
    const publicId = deletedSlider.url.split('.').pop();
    const removeImage = await cloudinaryRemove(publicId);
    res.status(200);
    res.json({ message: 'Slider is deleted' });
};

const sliderController = {
    getBanners,
    getSliders,
    getBannerById,
    createBanners,
    updateBanner,
    deleteBanner,
};
export default sliderController;
