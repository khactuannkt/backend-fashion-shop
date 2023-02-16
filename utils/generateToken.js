import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
const generateAuthToken = (payload, secret, options) => {
    return jwt.sign(payload, secret, options);
};
export default generateAuthToken;
