import { body, check, validationResult } from 'express-validator';
import { ObjectId } from 'mongodb';

const validate = {
    //====================Validate Banner==================
    getBannerById: [
        check('id').custom((id) => {
            if (!ObjectId.isValid(id)) {
                throw new Error('ID không hợp lệ');
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
    createDiscountCode: [
        check('code').trim().not().isEmpty().withMessage('Code is required'),
        check('discountType').custom((discountType) => {
            if (!discountType || discountType.trim() == '') {
                throw new Error('Discount type is required');
            }
            if (discountType !== 'percent' && discountType !== 'money') {
                throw new Error('Discount type must be "percent" or "money"');
            }
            return true;
        }),
        check('discount').custom((discount) => {
            if (!discount || String(discount).trim() === '') {
                throw new Error('Discount is required');
            }
            const _discount = Number(discount);
            if (!_discount || _discount < 0) {
                throw new Error('Discount must be an integer and must be greater than or equal to 0');
            }
            return true;
        }),
        check('startDate')
            .not()
            .isEmpty()
            .withMessage('Start date is required')
            .isDate()
            .withMessage('Start date is valid'),

        check('endDate')
            .not()
            .isEmpty()
            .withMessage('End date is required')
            .isDate()
            .withMessage('End date is valid')
            .custom((endDate, { req }) => {
                if (new Date(endDate) < new Date(req.body.startDate) || new Date(endDate) <= new Date()) {
                    throw new Error(
                        'The end date must be greater than or equal to the start date and must be greater than or equal to now',
                    );
                }
                return true;
            }),
        check('isUsageLimit')
            .trim()
            .not()
            .isEmpty()
            .withMessage('isUsageLimit is required')
            .isBoolean()
            .withMessage('isUsageLimit must be a boolean'),
        check('usageLimit').custom((usageLimit, { req }) => {
            if (new Boolean(req.body.isUsageLimit)) {
                if (!usageLimit || String(usageLimit).trim() === '') {
                    throw new Error('Usage limit is required');
                }
                const _usageLimit = Number(usageLimit);
                if (!_usageLimit || _usageLimit < 0) {
                    throw new Error('Usage limit must be an integer and must be greater than or equal to 0');
                }
            }

            return true;
        }),
        check('applicableProducts').custom((applicableProducts) => {
            applicableProducts.map((product) => {
                if (!ObjectId.isValid(product)) {
                    throw new Error('Product ID: "' + product + '" is not valid');
                }
            });
            return true;
        }),
    ],
    updateDiscountCode: [
        check('code').trim().not().isEmpty().withMessage('Code is required'),
        check('discountType').custom((discountType) => {
            if (!discountType || discountType.trim() == '') {
                throw new Error('Discount type is required');
            }
            if (discountType !== 'percent' && discountType !== 'money') {
                throw new Error('Discount type must be "percent" or "money"');
            }
            return true;
        }),
        check('discount').custom((discount) => {
            if (!discount || String(discount).trim() === '') {
                throw new Error('Discount is required');
            }
            const _discount = Number(discount);
            if (!_discount || _discount < 0) {
                throw new Error('Discount must be an integer and must be greater than or equal to 0');
            }
            return true;
        }),
        check('startDate')
            .not()
            .isEmpty()
            .withMessage('Start date is required')
            .isDate()
            .withMessage('Start date is valid'),

        check('endDate')
            .not()
            .isEmpty()
            .withMessage('End date is required')
            .isDate()
            .withMessage('End date is valid')
            .custom((endDate, { req }) => {
                if (new Date(endDate) < new Date(req.body.startDate) || new Date(endDate) <= new Date()) {
                    throw new Error(
                        'The end date must be greater than or equal to the start date and must be greater than or equal to now',
                    );
                }
                return true;
            }),
        check('isUsageLimit')
            .trim()
            .not()
            .isEmpty()
            .withMessage('isUsageLimit is required')
            .isBoolean()
            .withMessage('isUsageLimit must be a boolean'),
        check('usageLimit').custom((usageLimit, { req }) => {
            if (new Boolean(req.body.isUsageLimit)) {
                if (!usageLimit || String(usageLimit).trim() === '') {
                    throw new Error('Usage limit is required');
                }
                const _usageLimit = Number(usageLimit);
                if (!_usageLimit || _usageLimit < 0) {
                    throw new Error('Usage limit must be an integer and must be greater than or equal to 0');
                }
            }

            return true;
        }),
        check('applicableProducts').custom((applicableProducts) => {
            applicableProducts.map((product) => {
                if (!ObjectId.isValid(product)) {
                    throw new Error('Product ID: "' + product + '" is not valid');
                }
            });
            return true;
        }),
    ],

    //====================Validate User==================
    register: [
        check('name').trim().not().isEmpty().withMessage('Tên không được để trống'),
        check('email')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Email không được để trống')
            .isEmail()
            .withMessage('Địa chỉ email không hợp lệ'),
        check('phone')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Số điện thoại không được để trống')
            .isLength({ min: 10, max: 10 })
            .withMessage('Số điện thoại không hợp lệ')
            .isMobilePhone()
            .withMessage('Số điện thoại không hợp lệ'),
        check('password')
            .not()
            .isEmpty()
            .withMessage('Mật khẩu không được để trống')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*d)(?=.*[@$!%*?&])[A-Za-zd@$!%*?&]{8,255}$/)
            .withMessage(
                'Mật khẩu phải từ 8 - 255 ký tự, ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt và không có khoảng trắng',
            ),
    ],
    login: [
        check('email')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Email không được để trống')
            .isEmail()
            .withMessage('Địa chỉ email không hợp lệ'),
        check('password').trim().not().isEmpty().withMessage('Mật khẩu không được để trống'),
    ],
    updateProfile: [
        check('name').trim().not().isEmpty().withMessage('Tên không được để trống'),
        check('phone')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Số điện thoại không được để trống')
            .isLength({ min: 10, max: 10 })
            .withMessage('Số điện thoại không hợp lệ')
            .isMobilePhone()
            .withMessage('Số điện thoại không hợp lệ'),
        check('gender')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Giới tính không được để trống')
            .custom((gender) => {
                if (gender !== 'male' && gender !== 'female' && gender !== 'other') {
                    throw new Error('Giới tính phải là "male" hoặc "female" hoặc "other"');
                }
                return true;
            }),
        check('birthday')
            .not()
            .isEmpty()
            .withMessage('Ngày sinh không được để trống')
            .isDate()
            .withMessage('Ngày sinh không hợp lệ')
            .custom((birthday) => {
                if (new Date(birthday) >= new Date()) {
                    throw new Error('Ngày sinh phải bé hơn thời gian hiện tại');
                }
                return true;
            }),
        check('address').custom((address) => {
            if (!address) {
                throw new Error('Địa chỉ không được để trống');
            }
            if (!address.province || address.province.trim() === '') {
                throw new Error('Tỉnh/Thành phố không được để trống');
            }
            if (!address.district || address.district.trim() === '') {
                throw new Error('Quận/Huyện không được để trống');
            }
            if (!address.ward || address.ward.trim() === '') {
                throw new Error('Phường/Xã không được để trống');
            }
            if (!address.specificAddress || address.specificAddress.trim() === '') {
                throw new Error('Địa chỉ chi tiết không được để trống');
            }
            return true;
        }),
    ],
    forgotPassword: [
        check('email')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Email không được để trống')
            .isEmail()
            .withMessage('Địa chỉ email không hợp lệ'),
    ],
    resetPassword: [
        // check('email')
        //     .trim()
        //     .not()
        //     .isEmpty()
        //     .withMessage('Email không được để trống')
        //     .isEmail()
        //     .withMessage('Địa chỉ email không hợp lệ'),
        check('newPassword')
            .not()
            .isEmpty()
            .withMessage('Mật khẩu không được để trống')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*d)(?=.*[@$!%*?&])[A-Za-zd@$!%*?&]{8,255}$/)
            .withMessage(
                'Mật khẩu phải từ 8 - 255 ký tự, ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt và không có khoảng trắng',
            ),
        check('resetPasswordToken').not().isEmpty().withMessage('Token đặt lại mật khẩu không hợp lệ'),
    ],
    changePassword: [
        check('currentPassword').trim().not().isEmpty().withMessage('Mật khẩu hiện tại không được để trống'),
        check('newPassword')
            .not()
            .isEmpty()
            .withMessage('Mật khẩu mới không được để trống')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*d)(?=.*[@$!%*?&])[A-Za-zd@$!%*?&]{8,255}$/)
            .withMessage(
                'Mật khẩu phải từ 8 - 255 ký tự, ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt và không có khoảng trắng',
            ),
    ],

    //====================Validate Product==================
    //validate Product
    getProductById: [
        check('id').custom((id) => {
            if (!ObjectId.isValid(id)) {
                throw new Error('ID sản phẩm không hợp lệ');
            }
            return true;
        }),
    ],
    createProduct: [
        check('name').trim().notEmpty().withMessage('Tên sản phẩm không được để trống'),
        check('description').trim().notEmpty().withMessage('Mô tả sản phẩm không được để trống'),
        check('category')
            .notEmpty()
            .withMessage('Thể loại sản phẩm không được để trống')
            .custom((category) => {
                if (!ObjectId.isValid(category)) {
                    throw new Error('ID thể loại không hợp lệ');
                }
                return true;
            }),
        check('brand').trim().notEmpty().withMessage('Thương hiệu sản phẩm không được để trống'),
        check('keywords').isArray().withMessage('Danh sách từ khóa sản phẩm phải là mảng '),
        check('variants')
            .isArray()
            .withMessage('Danh sách biến thể phải là mảng')
            .notEmpty()
            .withMessage('Danh sách các biến thể không được để trống'),
        check('variants.*.price')
            .notEmpty()
            .withMessage('Giá của các biến thể sản phẩm không được để trống')
            .isInt({ min: 0 })
            .withMessage('Giá của các biến thể sản phẩm phải là số nguyên và phài lớn hơn hoặc bằng 0'),
        check('variants.*.priceSale')
            .notEmpty()
            .withMessage('Giá đã giảm của các biến thể sản phẩm không được để trống')
            .isInt({ min: 0 })
            .withMessage('Giá đã giảm của các biến thể sản phẩm phải là số nguyên và phài lớn hơn hoặc bằng 0'),
        check('variants.*.quantity')
            .notEmpty()
            .withMessage('Số lượng các biến thể sản phẩm không được để trống')
            .isInt({ min: 0 })
            .withMessage('Số lượng các biến thể sản phẩm phải là số nguyên và phài lớn hơn hoặc bằng 0'),
        check('variants.*.attributes')
            .isArray()
            .withMessage('Danh sách thuộc tính của biến thể phải là mảng')
            .notEmpty()
            .withMessage('Danh sách thuộc tính các biến thể không được để trống'),
        check('variants.*.attributes.*.name')
            .trim()
            .notEmpty()
            .withMessage('Tên các thuộc tính của biến thể sản phẩm không được để trống'),
        check('variants.*.attributes.*.value')
            .trim()
            .notEmpty()
            .withMessage('Giá trị các thuộc tính của biến thể sản phẩm không được để trống'),
    ],
    updateProduct: [
        check('id').custom((id) => {
            if (!ObjectId.isValid(id)) {
                throw new Error('ID sản phẩm không hợp lệ');
            }
            return true;
        }),
        check('name').trim().notEmpty().withMessage('Tên sản phẩm không được để trống'),
        check('description').trim().notEmpty().withMessage('Mô tả sản phẩm không được để trống'),
        check('category')
            .notEmpty()
            .withMessage('Thể loại sản phẩm không được để trống')
            .custom((category) => {
                if (!ObjectId.isValid(category)) {
                    throw new Error('ID thể loại không hợp lệ');
                }
                return true;
            }),
        check('images').isArray().withMessage('Danh sách hình ảnh phải là mảng'),
        check('images.*').isURL().withMessage('Danh sách hình ảnh phải là các URL hoặc file'),
        check('brand').trim().notEmpty().withMessage('Thương hiệu sản phẩm không được để trống'),
        check('keywords').isArray().withMessage('Danh sách từ khóa sản phẩm phải là mảng '),
        check('variants')
            .isArray()
            .withMessage('Danh sách biến thể phải là mảng')
            .notEmpty()
            .withMessage('Danh sách các biến thể không được để trống'),
        check('variants.*.price')
            .notEmpty()
            .withMessage('Giá của các biến thể sản phẩm không được để trống')
            .isInt({ min: 0 })
            .withMessage('Giá của các biến thể sản phẩm phải là số nguyên và phài lớn hơn hoặc bằng 0'),
        check('variants.*.priceSale')
            .notEmpty()
            .withMessage('Giá đã giảm của các biến thể sản phẩm không được để trống')
            .isInt({ min: 0 })
            .withMessage('Giá đã giảm của các biến thể sản phẩm phải là số nguyên và phài lớn hơn hoặc bằng 0'),
        check('variants.*.quantity')
            .notEmpty()
            .withMessage('Số lượng các biến thể sản phẩm không được để trống')
            .isInt({ min: 0 })
            .withMessage('Số lượng các biến thể sản phẩm phải là số nguyên và phải lớn hơn hoặc bằng 0'),
        check('variants.*.attributes')
            .isArray()
            .withMessage('Danh sách thuộc tính của biến thể phải là mảng')
            .notEmpty()
            .withMessage('Danh sách thuộc tính các biến thể không được để trống'),
        check('variants.*.attributes.*.name')
            .trim()
            .notEmpty()
            .withMessage('Tên các thuộc tính của biến thể sản phẩm không được để trống'),
        check('variants.*.attributes.*.value')
            .trim()
            .notEmpty()
            .withMessage('Giá trị các thuộc tính của biến thể sản phẩm không được để trống'),
    ],
    review: [
        check('id').custom((id) => {
            if (!ObjectId.isValid(id)) {
                throw new Error('ID sản phẩm không hợp lệ');
            }
            return true;
        }),
        check('rating')
            .notEmpty()
            .withMessage('Số sao đánh giá không được để trống')
            .isInt({ min: 1, max: 5 })
            .withMessage('Số sao đánh giá phải là số nguyên từ 1 đến 5'),
    ],
    hide: [
        check('id').custom((id) => {
            if (!ObjectId.isValid(id)) {
                throw new Error('ID sản phẩm không hợp lệ');
            }
            return true;
        }),
    ],
    unhide: [
        check('id').custom((id) => {
            if (!ObjectId.isValid(id)) {
                throw new Error('ID sản phẩm không hợp lệ');
            }
            return true;
        }),
    ],
    restore: [
        check('id').custom((id) => {
            if (!ObjectId.isValid(id)) {
                throw new Error('ID sản phẩm không hợp lệ');
            }
            return true;
        }),
    ],
    delete: [
        check('id').custom((id) => {
            if (!ObjectId.isValid(id)) {
                throw new Error('ID sản phẩm không hợp lệ');
            }
            return true;
        }),
    ],
};
export default validate;
