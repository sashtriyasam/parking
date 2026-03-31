const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { VALID_ROLES } = require('../constants/roles');

/**
 * Update a user's role (Admin only)
 * PATCH /api/v1/admin/users/:userId/role
 */
const updateUserRole = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !VALID_ROLES.includes(role)) {
        return next(new AppError(`Please provide a valid role (${VALID_ROLES.join(', ')})`, 400));
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // Guard 1: Prevent self-demotion
    if (userId === req.user.id && role !== 'ADMIN') {
        return next(new AppError('You cannot demote yourself from the ADMIN role.', 400));
    }

    // Guard 2: Prevent removing the last admin
    if (user.role === 'ADMIN' && role !== 'ADMIN') {
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
        if (adminCount <= 1) {
            return next(new AppError('Permission denied. Cannot remove the last administrator on the platform.', 403));
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
            id: true,
            email: true,
            full_name: true,
            role: true,
            updated_at: true
        }
    });

    res.status(200).json({
        status: 'success',
        message: `User role updated to ${role}`,
        data: {
            user: updatedUser
        }
    });
});

/**
 * Get all pending withdrawals (Admin only)
 */
const getPendingWithdrawals = asyncHandler(async (req, res) => {
    const withdrawals = await prisma.withdrawal.findMany({
        where: { status: 'PENDING' },
        include: {
            provider: {
                select: { id: true, email: true, full_name: true, phone_number: true }
            }
        },
        orderBy: { created_at: 'asc' }
    });

    res.status(200).json({
        status: 'success',
        results: withdrawals.length,
        data: withdrawals
    });
});

/**
 * Approve or Reject a withdrawal
 */
const processWithdrawal = asyncHandler(async (req, res, next) => {
    const { withdrawalId } = req.params;
    const { status, remarks } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
        return next(new AppError('Invalid status. Must be APPROVED or REJECTED', 400));
    }

    const updatedWithdrawal = await prisma.$transaction(async (tx) => {
        // 1. Fetch and validate status inside transaction to prevent race conditions
        const withdrawal = await tx.withdrawal.findUnique({
            where: { id: withdrawalId }
        });

        if (!withdrawal) {
            throw new AppError('Withdrawal request not found', 404);
        }

        if (withdrawal.status !== 'PENDING') {
            throw new AppError('Withdrawal request not found or already processed', 400);
        }

        // 2. Update withdrawal status
        const w = await tx.withdrawal.update({
            where: { id: withdrawalId },
            data: {
                status,
                processed_at: new Date(),
                remarks
            }
        });

        // 3. If REJECTED, refund the balance to the provider
        if (status === 'REJECTED') {
            await tx.user.update({
                where: { id: withdrawal.provider_id },
                data: {
                    balance: { increment: withdrawal.amount }
                }
            });
        }

        return w;
    });

    res.status(200).json({
        status: 'success',
        message: `Withdrawal successfully ${status.toLowerCase()}`,
        data: updatedWithdrawal
    });
});

module.exports = {
    updateUserRole,
    getPendingWithdrawals,
    processWithdrawal
};
