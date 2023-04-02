import crypto from 'crypto';

const createRequestBody = (orderId, orderInfo, amount, redirectUrl, ipnUrl) => {
    //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
    //parameters
    var accessKey = 'F8BBA842ECF85';
    var secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    // var orderInfo = 'pay with MoMo';
    var partnerCode = 'MOMO';
    // var redirectUrl = redirectUrl;
    // var ipnUrl = ipnUrl;
    var requestType = 'payWithMethod';
    // var amount = amount;
    // var orderId = orderId;
    var requestId = orderId;
    var extraData = '';
    var paymentCode =
        'T8Qii53fAXyUftPV3m9ysyRhEanUs9KlOPfHgpMR0ON50U10Bh+vZdpJU7VY4z+Z2y77fJHkoDc69scwwzLuW5MzeUKTwPo3ZMaB29imm6YulqnWfTkgzqRaion+EuD7FN9wZ4aXE1+mRt0gHsU193y+yxtRgpmY7SDMU9hCKoQtYyHsfFR5FUAOAKMdw2fzQqpToei3rnaYvZuYaxolprm9+/+WIETnPUDlxCYOiw7vPeaaYQQH0BF0TxyU3zu36ODx980rJvPAgtJzH1gUrlxcSS1HQeQ9ZaVM1eOK/jl8KJm6ijOwErHGbgf/hVymUQG65rHU2MWz9U8QUjvDWA==';
    var orderGroupId = '';
    var autoCapture = true;
    var lang = 'vi';

    //before sign HMAC SHA256 with format
    //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
    var rawSignature =
        'accessKey=' +
        accessKey +
        '&amount=' +
        amount +
        '&extraData=' +
        extraData +
        '&ipnUrl=' +
        ipnUrl +
        '&orderId=' +
        orderId +
        '&orderInfo=' +
        orderInfo +
        '&partnerCode=' +
        partnerCode +
        '&redirectUrl=' +
        redirectUrl +
        '&requestId=' +
        requestId +
        '&requestType=' +
        requestType;
    //puts raw signature
    // console.log("--------------------RAW SIGNATURE----------------");
    // console.log(rawSignature);
    //signature
    var signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
    // console.log("--------------------SIGNATURE----------------");
    // console.log(signature);

    //json object send to MoMo endpoint
    const requestBody = JSON.stringify({
        partnerCode: partnerCode,
        partnerName: 'FashionShop',
        storeId: 'FashionShop',
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: redirectUrl,
        ipnUrl: ipnUrl,
        lang: lang,
        requestType: requestType,
        autoCapture: autoCapture,
        extraData: extraData,
        orderGroupId: orderGroupId,
        signature: signature,
    });
    return { requestBody, signature };
};
export default createRequestBody;
// //Create the HTTPS objects
// const https = require('https');
// const options = {
//     hostname: 'test-payment.momo.vn',
//     port: 443,
//     path: '/v2/gateway/api/create',
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json',
//         'Content-Length': Buffer.byteLength(requestBody),
//     },
// };
//Send the request and get the response
// const req = https.request(options, (res) => {
//     console.log(`Status: ${res.statusCode}`);
//     console.log(`Headers: ${JSON.stringify(res.headers)}`);
//     res.setEncoding('utf8');
//     res.on('data', (body) => {
//         console.log('Body: ');
//         console.log(body);
//         console.log('resultCode: ');
//         console.log(JSON.parse(body).resultCode);
//     });
//     res.on('end', () => {
//         console.log('No more data in response.');
//     });
// });

// req.on('error', (e) => {
//     console.log(`problem with request: ${e.message}`);
// });
// // write data to request body
// console.log('Sending....');
// req.write(requestBody);
// req.end();
