import axios from 'axios';

export const GHN_Request = axios.create({
    baseURL: 'https://dev-online-gateway.ghn.vn/shiip/public-api',
    headers: {
        'Content-Type': 'application/json',
        token: process.env.GHN_TOKEN_API,
        shopId: process.env.GHN_SHOP_ID,
    },
});

export const momo_Request = axios.create({
    baseURL: 'https://test-payment.momo.vn/v2/gateway/api',
    headers: {
        'Content-Type': 'application/json',
        // 'Content-Length': Buffer.byteLength(requestBody),
    },
});
