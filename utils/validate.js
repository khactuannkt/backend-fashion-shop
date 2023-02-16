import { check, validationResult } from 'express-validator';

const validate = {
    register: [
        check('name').not().isEmpty().withMessage('Name is required'),
        check('email').not().isEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address'),
        check('phone')
            .not()
            .isEmpty()
            .withMessage('Phone is required')
            .isLength({ min: 10, max: 10 })
            .withMessage('Invalid phone number')
            .isMobilePhone()
            .withMessage('Invalid phone number'),
        check('password')
            .not()
            .isEmpty()
            .withMessage('Password is required')
            .isLength({ min: 6, max: 255 })
            .withMessage('Password must be at least 6 characters long and 255 characters shorter'),
    ],
    login: [
        check('email').not().isEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address'),
        check('password').not().isEmpty().withMessage('Password is required'),
    ],
};
export default validate;
