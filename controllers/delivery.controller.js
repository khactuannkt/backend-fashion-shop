import * as fs from 'fs';
import { GHN_Request } from '../utils/request.js';
import { validationResult } from 'express-validator';
import { config } from 'dotenv';

const getDistrict = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const province_id = Number(req.body.province_id) || null;
    const config = {
        data: JSON.stringify({
            province_id,
        }),
    };
    await GHN_Request.get('/master-data/district', config)
        .then((response) => {
            res.status(200).json({ message: 'Success', data: { districts: response.data.data } });
        })
        .catch((error) => {
            if (error?.response?.status && error.response.status == '400') {
                res.status(error.response.status);
                throw new Error('Mã tỉnh/thành phố không tồn tại');
            } else {
                res.status(500);
                throw new Error(error.response.message || error.message);
            }
        });
};
const getWard = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const district_id = Number(req.body.district_id) || null;

    const config = {
        data: JSON.stringify({
            district_id,
        }),
    };
    await GHN_Request.get('/master-data/ward', config)
        .then((response) => {
            res.status(200).json({ message: 'Success', data: { wards: response.data.data } });
        })
        .catch((error) => {
            if (error?.response?.status && error.response.status == '400') {
                res.status(error.response.status);
                throw new Error('Mã quận/huyện không tồn tại');
            } else {
                res.status(500);
                throw new Error(error.response.message || error.message);
            }
        });
};
const getProvince = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    await GHN_Request.get('/master-data/province', config)
        .then((response) => {
            res.status(200).json({ message: 'Success', data: { provinces: response.data.data } });
        })
        .catch((error) => {
            if (error?.response?.status && error.response.status == '400') {
                res.status(error.response.status);
                throw new Error('Mã tỉnh/thành phố không tồn tại');
            } else {
                res.status(500);
                throw new Error(error.response.message || error.message);
            }
        });
};
const calculateFee = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const {
        from_district_id = null,
        service_id,
        to_district_id,
        to_ward_code,
        height = null,
        length = null,
        weight,
        width = null,
        insurance_value = null,
        coupon = null,
    } = req.body;

    const config = {
        data: JSON.stringify({
            from_district_id,
            service_id,
            to_district_id,
            to_ward_code,
            height,
            length,
            weight,
            width,
            insurance_value,
            coupon,
        }),
    };
    await GHN_Request.get('v2/shipping-order/fee', config)
        .then((response) => {
            res.status(200).json({ message: 'Success', data: { districts: response.data.data } });
        })
        .catch((error) => {
            if (error?.response?.status && error.response.status == '400') {
                res.status(error.response.status);
                throw new Error('Sai thông tin đầu vào. Vui lòng thử lại.');
            } else {
                res.status(500);
                throw new Error(error.response.message || error.message);
            }
        });
};

const estimatedDeliveryTime = async (req, res) => {
    // Validate the request data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(400).json({ message: message });
    }
    const { from_district_id, from_ward_code, service_id, to_district_id, to_ward_code } = req.body;

    const config = {
        data: JSON.stringify({
            from_district_id,
            from_ward_code,
            service_id,
            to_district_id,
            to_ward_code,
        }),
    };
    await GHN_Request.get('v2/shipping-order/leadtime', config)
        .then((response) => {
            res.status(200).json({ message: 'Success', data: { leadTime: response.data.data } });
        })
        .catch((error) => {
            if (error?.response?.status && error.response.status == '400') {
                res.status(error.response.status);
                throw new Error('Sai thông tin đầu vào. Vui lòng thử lại.');
            } else {
                res.status(500);
                throw new Error(error.response.message || error.message);
            }
        });
};

// const createShippingOrder = async (req, res) => {
//     // Validate the request data using express-validator
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         const message = errors.array()[0].msg;
//         return res.status(400).json({ message: message });
//     }
//     const {
//         payment_type_id,
//         note,
//         from_name,
//         from_phone,
//         from_address,
//         from_ward_name,
//         from_district_name,
//         from_province_name,
//         required_note,
//         return_name,
//         return_phone,
//         return_address,
//         return_ward_name,
//         return_district_name,
//         return_province_name,
//         client_order_code,
//         to_name,
//         to_phone,
//         to_address,
//         to_ward_name,
//         to_district_name,
//         to_province_name,
//         cod_amount,
//         content,
//         weight,
//         length,
//         width,
//         height,
//         cod_failed_amount,
//         pick_station_id,
//         deliver_station_id,
//         insurance_value,
//         service_id,
//         service_type_id,
//         coupon,
//         pick_shift,
//         pickup_time,
//         items,
//     } = req.body;

//     const config = {
//         data: JSON.stringify({
//             payment_type_id,
//             note,
//             from_name,
//             from_phone,
//             from_address,
//             from_ward_name,
//             from_district_name,
//             from_province_name,
//             required_note,
//             return_name,
//             return_phone,
//             return_address,
//             return_ward_name,
//             return_district_name,
//             return_province_name,
//             client_order_code,
//             to_name,
//             to_phone,
//             to_address,
//             to_ward_name,
//             to_district_name,
//             to_province_name,
//             cod_amount,
//             content,
//             weight,
//             length,
//             width,
//             height,
//             cod_failed_amount,
//             pick_station_id,
//             deliver_station_id,
//             insurance_value,
//             service_id,
//             service_type_id,
//             coupon,
//             pick_shift,
//             pickup_time,
//             items,
//         }),
//     };
//     await GHN_Request.get('v2/shipping-order/create', config)
//         .then((response) => {
//             res.status(200).json({ message: 'Success', data: { shippingOrder: response.data.data } });
//         })
//         .catch((error) => {
//             if (error.response.status && error.response.status == '400') {
//                 res.status(error.response.status);
//                 throw new Error('Sai thông tin đầu vào. Vui lòng thử lại.');
//             } else {
//                 res.status(500);
//                 throw new Error(error.response.message || error.message);
//             }
//         });
// };

const deliveryController = {
    getDistrict,
    getWard,
    getProvince,
    calculateFee,
    estimatedDeliveryTime,
    // createShippingOrder,
};
export default deliveryController;
