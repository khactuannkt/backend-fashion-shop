import jwt from 'jsonwebtoken';
const generateAuthToken = (payload, secret, options) => {
    return jwt.sign(payload, secret, options);
};
export default generateAuthToken;
