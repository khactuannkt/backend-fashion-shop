import { check, validationResult } from 'express-validator';

const validate = {
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
};
export default validate;
