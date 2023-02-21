import jwt, { decode } from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/user.model.js';

const protect = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.ACCESS_JWT_SECRET);
            const userId = decoded._id || null;
            req.user = await User.findOne({ _id: userId, isVerified: true }).select('-password');
            next();
        } catch (error) {
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }
    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

// const admin = (req, res, next) => {
//     if (req.user && req.user.isAdmin) {
//         next();
//     } else {
//         res.status(401);
//         throw new Error('Not authorized as an Admin');
//     }
// };

const auth =
    (...acceptedRoles) =>
    (req, res, next) => {
        const index = acceptedRoles.indexOf(req.user.role);
        if (index != -1) {
            next();
        } else {
            const roleRepresentation = req.user.role[0].toUpperCase() + req.user.role.substring(1);
            res.status(403);
            throw new Error(`${roleRepresentation} is not allowed to access this resources`);
        }
    };
// export { protect, admin, auth };
export { protect, auth };
