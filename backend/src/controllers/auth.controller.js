const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { generateTokens, verifyRefreshToken, hashToken } = require('../utils/token');

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Helper to store a hashed refresh token in the database
 */
const storeRefreshToken = async (userId, token) => {
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    return await prisma.refreshToken.create({
        data: {
            token_hash: hashToken(token),
            user_id: userId,
            expires_at: expiresAt,
        }
    });
};

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

    // Create user (accept role for QA test, default to CUSTOMER)
    let newUser;
    try {
        newUser = await prisma.user.create({
            data: {
                email,
                password_hash,
                full_name,
                phone_number,
                role: role || 'CUSTOMER',
            },
        });
    } catch (error) {
        if (error.code === 'P2002') {
            const target = error.meta?.target || [];
            if (target.includes('email')) {
                return next(new AppError('Email already in use', 400));
            }
            if (target.includes('phone_number')) {
                return next(new AppError('Phone number already associated with another account', 400));
            }
            return next(new AppError('User with these credentials already exists', 400));
        }
        if (error.code === 'P2000') {
            return next(new AppError('Invalid input data', 400));
        }
        return next(new AppError('Registration failed. Please try again.', 500));
    }

    // Generate tokens
    const tokens = generateTokens(newUser.id, newUser.role);

    // Store refresh token in DB
    await storeRefreshToken(newUser.id, tokens.refreshToken);

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

    // Find user by email OR phone number
    let user;
    try {
        user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { phone_number: email }
                ]
            },
        });
    } catch (error) {
        return next(new AppError('Login failed. Please try again.', 500));
    }

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return next(new AppError('Invalid email or password', 401));
    }

    // Generate tokens
    const tokens = generateTokens(user.id, user.role);

    // Store refresh token in DB
    await storeRefreshToken(user.id, tokens.refreshToken);

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

// AI TEST:
// ✅ Refresh token must exist in DB (not just valid JWT)
// ✅ Old token deleted before new one created (rotation)
// ✅ Reusing an old refresh token → 401 (already deleted)
// ✅ Logout deletes all refresh tokens for user
const refresh = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(new AppError('Refresh token is required', 400));
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);
        
        // Use atomic delete-and-check to prevent concurrent reuse (BUG-014 fix)
        const deleteResult = await prisma.refreshToken.deleteMany({
            where: {
                token_hash: hashToken(refreshToken),
                expires_at: { gte: new Date() }
            }
        });

        if (deleteResult.count === 0) {
            return next(new AppError('Refresh token is invalid or expired', 401));
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
        });

        // Generate new tokens
        const tokens = generateTokens(user.id, user.role);

        // Store new refresh token in DB
        await storeRefreshToken(user.id, tokens.refreshToken);

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

const updatePushToken = asyncHandler(async (req, res, next) => {
    const { push_token } = req.body;

    if (!push_token) {
        return next(new AppError('Push token is required', 400));
    }

    await prisma.user.update({
        where: { id: req.user.id },
        data: { push_token },
    });

    res.status(200).json({
        status: 'success',
        message: 'Push token updated successfully',
    });
});

const logout = asyncHandler(async (req, res) => {
    // Delete all refresh tokens for this user (logs out from all devices)
    await prisma.refreshToken.deleteMany({
        where: { user_id: req.user.id }
    });
    res.status(200).json({ status: 'success', message: 'Logged out from all sessions successfully' });
});

const switchRole = asyncHandler(async (req, res, next) => {
    const user = req.user;
    const newRole = user.role === 'PROVIDER' ? 'CUSTOMER' : 'PROVIDER';

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { role: newRole },
    });

    // Generate new tokens with updated role
    const tokens = generateTokens(updatedUser.id, updatedUser.role);
    await storeRefreshToken(updatedUser.id, tokens.refreshToken);

    res.status(200).json({
        status: 'success',
        data: {
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                full_name: updatedUser.full_name,
                role: updatedUser.role,
            },
            ...tokens,
        },
    });
});

// TEMPORARY: Seed admin in production and ensure password is correct
const seedProductionAdmin = asyncHandler(async (req, res, next) => {
    const email = 'admin@parkeasy.com';
    const password = 'password123';
    
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    const user = await prisma.user.upsert({
        where: { email },
        update: { password_hash },
        create: {
            email,
            password_hash,
            full_name: 'Admin Tester',
            role: 'CUSTOMER',
            phone_number: '9876543210'
        }
    });
    
    res.status(200).json({
        status: 'success',
        message: 'Production admin account seeded/reset successfully',
        account: { email, password }
    });
});

module.exports = {
    register,
    login,
    getMe,
    refresh,
    updatePushToken,
    logout,
    switchRole,
    seedProductionAdmin
};
