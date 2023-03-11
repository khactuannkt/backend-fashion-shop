import { body, check, validationResult } from 'express-validator';
import { ObjectId } from 'mongodb';

function isUrl(str) {
    try {
        const parsedUrl = new URL(str);
        return parsedUrl.href === str;
    } catch (err) {
        return false;
    }
}
const validate = {
    //====================Validate Banner==================
    getBannerById: [
        check('id').custom((id) => {
            if (!ObjectId.isValid(id)) {
                throw new Error('ID is not valid');
            }
            return true;
        }),
    ],
    createBanner: [
        check('title').trim().not().isEmpty().withMessage('Title is required'),
        check('imageUrl').custom((imageUrl) => {
            if (!isUrl(imageUrl)) {
                throw new Error('URL image must be an url');
            }
            return true;
        }),
        check('role').custom((role) => {
            if (!role || role.trim() == '') {
                throw new Error('Role is required');
            }
            if (role !== 'slider' && role !== 'banner') {
                throw new Error('Role must be "slider" or "banner"');
            }
            return true;
        }),
        check('index').custom((index) => {
            if (!index || index.trim() === '') {
                throw new Error('Index is required');
            }
            const _index = Number(index);
            if (!_index || _index <= 0) {
                throw new Error('Index must be an integer and must be greater than 0');
            }
            return true;
        }),
    ],
    updateBanner: [
        check('id').custom((id) => {
            if (!ObjectId.isValid(id)) {
                throw new Error('ID is not valid');
            }
            return true;
        }),
        check('title').trim().not().isEmpty().withMessage('Title is required'),
        check('imageUrl').custom((imageUrl) => {
            if (!isUrl(imageUrl)) {
                throw new Error('URL image must be an url');
            }
            return true;
        }),
    ],

    //====================Validate Cart==================
    updateCartItem: [
        check('variantId').custom((variantId) => {
            if (!ObjectId.isValid(variantId)) {
                throw new Error('Variant ID is not valid');
            }
            return true;
        }),
        // .trim().not().isEmpty().withMessage('variantId is required'),
        check('quantity').custom((quantity) => {
            if (!quantity || quantity.trim() === '') {
                throw new Error('Quantity is required');
            }
            const _quantity = Number(quantity);
            if (!_quantity || _quantity <= 0) {
                throw new Error('The quantity must be an integer and must be greater than or equal to 0');
            }
            return true;
        }),
    ],
    addProductToCart: [
        check('variantId').custom((variantId) => {
            if (!ObjectId.isValid(variantId)) {
                throw new Error('Variant ID is not valid');
            }
            return true;
        }),
        check('quantity').custom((quantity) => {
            if (!quantity || quantity.trim() === '') {
                throw new Error('Quantity is required');
            }
            const _quantity = Number(quantity);
            if (!_quantity || _quantity <= 0) {
                throw new Error('The quantity must be an integer and must be greater than or equal to 0');
            }
            return true;
        }),
    ],
    removeCartItems: [
        check('variantIds').custom((variantIds) => {
            if (!variantIds || variantIds.length <= 0) {
                throw new Error('Variant ID is required');
            }
            variantIds.map((variant) => {
                if (!ObjectId.isValid(variant)) {
                    throw new Error('Variant ID: "' + variant + '" is not valid');
                }
            });
            return true;
        }),
    ],

    //====================Validate Category==================
    createCategory: [
        check('name').trim().not().isEmpty().withMessage('Name is required'),
        check('level').custom((level) => {
            if (!level || String(level).trim() === '') {
                throw new Error('Level is required');
            }
            const _level = Number(level);
            if (!_level || _level < 1) {
                throw new Error('Level must be an integer and must be large or 1');
            }
            return true;
        }),
        check('image').custom((image) => {
            if (!isUrl(image)) {
                throw new Error('URL image must be an url');
            }
            return true;
        }),
    ],
    updateCategory: [
        check('id').custom((id) => {
            if (!ObjectId.isValid(id)) {
                throw new Error('Category ID is not valid');
            }
            return true;
        }),
        check('name').trim().not().isEmpty().withMessage('Name is required'),
        check('image').custom((image) => {
            if (!isUrl(image)) {
                throw new Error('URL image must be an url');
            }
            return true;
        }),
        check('level').custom((level) => {
            if (!level || String(level).trim() === '') {
                throw new Error('Level is required');
            }
            const _level = Number(level);
            if (!_level || _level < 1) {
                throw new Error('Level must be an integer and must be large or 1');
            }
            return true;
        }),
        check('parent').custom((parent) => {
            if (!ObjectId.isValid(parent)) {
                throw new Error('Parent category ID is not valid');
            }
            return true;
        }),
    ],

    //====================Validate Discount Code==================
    createDiscountCode: [],

    //====================Validate User==================
    register: [
        check('name').trim().not().isEmpty().withMessage('Name is required'),
        check('email')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Invalid email address'),
        check('phone')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Phone is required')
            .isLength({ min: 10, max: 10 })
            .withMessage('Invalid phone number')
            .isMobilePhone()
            .withMessage('Invalid phone number'),
        check('password')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Password is required')
            .isLength({ min: 6, max: 255 })
            .withMessage('Password must be at least 6 characters long and 255 characters shorter'),
    ],
    login: [
        check('email')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Invalid email address'),
        check('password').trim().not().isEmpty().withMessage('Password is required'),
    ],
    resetPassword: [
        check('email')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Invalid email address'),
        check('newPassword')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Password is required')
            .isLength({ min: 6, max: 255 })
            .withMessage('Password must be at least 6 characters long and 255 characters shorter'),
        check('resetPasswordToken').not().isEmpty().withMessage('Reset password token is required'),
    ],

    //====================Validate Product==================
    //validate Product
    createProduct: [
        check('name').trim().not().isEmpty().withMessage('Name is required'),
        check('images').not().isEmpty().withMessage('Image is required'),
        check('description').trim().not().isEmpty().withMessage('Description is required'),
        check('category').trim().not().isEmpty().withMessage('Category is required'),
        check('brand').trim().not().isEmpty().withMessage('Brand is required'),
        check('price')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Price is required')
            .isInt({ min: 1 })
            .withMessage('Price must be an integer and must be greater than 0'),
        check('priceSale')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Price Sale is required')
            .isInt({ min: 1 })
            .withMessage('Price Sale must be an integer and must be greater than 0'),
        check('quantity')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Quantity is required')
            .isInt({ min: 0 })
            .withMessage('The quantity must be an integer and must be greater than or equal to 0'),
    ],
};
export default validate;
