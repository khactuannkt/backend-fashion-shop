import { check, validationResult } from 'express-validator';

const validate = {
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
    //====================Validate Category==================
    createCategory: [
        check('name').trim().not().isEmpty().withMessage('Name is required'),
        check('level')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Level is required')
            .isInt({ min: 1 })
            .withMessage('Level must be an integer and must be large or 1'),
        // check('parent').trim().not().isEmpty().withMessage('Parent Category is required'),
    ],
    updateCategory: [
        check('name').trim().not().isEmpty().withMessage('Name is required'),
        check('image').trim().not().isEmpty().withMessage('Image is required'),
        check('level')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Level is required')
            .isInt({ min: 1 })
            .withMessage('Level must be an integer and must be large or 1'),
        check('parent').trim().not().isEmpty().withMessage('Parent Category is required'),
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
    //====================Validate Banner==================

    createBanner: [
        check('title').trim().not().isEmpty().withMessage('Title is required'),
        check('imageUrl').custom((imageUrl, { req }) => {
            if (!req.file) {
                if (!imageUrl || imageUrl.trim() == '') {
                    throw new Error('Image is required');
                }
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
        check('index')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Index is required')
            .isInt({ min: 1 })
            .withMessage('Index must be an integer and must be greater than 0'),
    ],
    updateBanner: [
        check('title').trim().not().isEmpty().withMessage('Title is required'),
        check('imageUrl').custom((imageUrl, { req }) => {
            if (!req.file) {
                if (!imageUrl || imageUrl.trim() == '') {
                    throw new Error('Image is required');
                }
            }
            return true;
        }),
    ],
};
export default validate;
