const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/token');
const prisma = require('../config/db');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
        // Only allow query tokens for PDF/Invoice downloads as they are often accessed via direct browser links
        const allowedQueryTokenPaths = [
            /\/api\/v1\/customer\/booking\/.*\/pdf/,
            /\/api\/v1\/customer\/booking\/.*\/invoice\.pdf/
        ];
        
        const isWhitelisted = allowedQueryTokenPaths.some(pattern => pattern.test(req.originalUrl));
        
        if (isWhitelisted) {
            token = req.query.token;
        } else {
            return next(new AppError('Query tokens are not allowed for this endpoint. Please use Authorization header.', 401));
        }
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    try {
        const decoded = verifyAccessToken(token);

        // Check if user still exists
        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.sub },
        });

        if (!currentUser) {
            return next(
                new AppError('The user belonging to this token no longer does exist.', 401)
            );
        }

        // Grant access to protected route
        req.user = currentUser;
        next();
    } catch (error) {
        return next(new AppError('Invalid token or token expired', 401));
    }
});

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
};

module.exports = {
    protect,
    restrictTo,
};
