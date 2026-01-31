const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { generateTokens } = require('../utils/token');

const register = asyncHandler(async (req, res, next) => {
    const { email, password, full_name, phone_number, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return next(new AppError('Email already in use', 400));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
        data: {
            email,
            password_hash,
            full_name,
            phone_number,
            role,
        },
    });

    // Generate tokens
    const tokens = generateTokens(newUser.id, newUser.role);

    // Send response
    res.status(201).json({
        status: 'success',
        data: {
            user: {
                id: newUser.id,
                email: newUser.email,
                full_name: newUser.full_name,
                role: newUser.role,
            },
            ...tokens,
        },
    });
});

const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return next(new AppError('Invalid email or password', 401));
    }

    // Generate tokens
    const tokens = generateTokens(user.id, user.role);

    res.status(200).json({
        status: 'success',
        data: {
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
            },
            ...tokens,
        },
    });
});

const refresh = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(new AppError('Refresh token is required', 400));
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);

        // Find user
        const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
        });

        if (!user) {
            return next(new AppError('User no longer exists', 401));
        }

        // Generate new tokens
        const tokens = generateTokens(user.id, user.role);

        res.status(200).json({
            status: 'success',
            data: {
                ...tokens,
            },
        });
    } catch (error) {
        return next(new AppError('Invalid or expired refresh token', 401));
    }
});

const getMe = asyncHandler(async (req, res) => {
    const user = req.user;
    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

module.exports = {
    register,
    login,
    getMe,
    refresh,
};
