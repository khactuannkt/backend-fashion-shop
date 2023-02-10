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
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
        res.status(404);
        throw new Error('Banner not found');
    }
    res.status(200);
    res.json(banner);
};

const createBanners = async (req, res) => {
    if (!req.files || req.files.length == 0) {
        res.status(400);
        throw new Error('Image not provided');
    }
    const uploadImages = req.files.map(async (file) => {
        const image = await cloudinaryUpload(file.path);
        if (!image) {
            res.status(500);
            throw new Error('Some banners was not uploaded due to unknown error');
        }
        fs.unlink(file.path, (error) => {
            if (error) {
                throw new Error(error);
            }
        });
        const banner = new Banner({
            url: image.secure_url,
        });
        return banner.save();
    });
    await Promise.all(uploadImages);
    res.status(201);
    res.json({ message: 'Banners are added' });
};

const updateSlider = async (req, res) => {
    const slider = await Banner.findById(req.params.id);
    if (!slider) {
        res.status(404);
        throw new Error('Slider not found');
    }
    if (!req.file) {
        res.status(400);
        throw new Error('Image not provided');
    }
    const image = await cloudinaryUpload(req.file.path);
    if (!image) {
        res.status(500);
        throw new Error('Error while uploading image');
    }
    const publicId = slider.url.split('.').pop();
    const removeOldImageCloudinary = cloudinaryRemove(publicId);
    const removeNewImageLocal = fs.promises.unlink(req.file.path);
    slider.url = image.secure_url.toString();
    const [newSlider, ...rest] = await Promise.all([slider.save(), removeOldImageCloudinary, removeNewImageLocal]);
    res.status(200);
    res.json(newSlider);
};

const deleteSlider = async (req, res) => {
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
    createSliders: createBanners,
    updateSlider,
    deleteSlider,
};
export default sliderController;
