import { v2 as cloudinary } from 'cloudinary';
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUpload = (file, folder, public_id) => {
    return cloudinary.uploader.upload(file, {
        resource_type: 'auto',
        folder: folder,
        public_id: public_id,
    });
};

const cloudinaryRemove = (publicId) => {
    return cloudinary.uploader.destroy(publicId);
};

export { cloudinaryUpload, cloudinaryRemove };
