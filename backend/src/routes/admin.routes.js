const express = require('express');
const adminController = require('../controllers/admin.controller');
const { protect, restrictTo } = require('../middleware/auth');

const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { roleUpdateSchema, processWithdrawalSchema } = require('../validators/admin.validator');

const router = express.Router();

// Role Update Limiter: 10 per hour
const roleUpdateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 10,
    message: 'Too many administrative actions from this IP, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
});


router.use(protect);
router.use(restrictTo('ADMIN'));

router.patch(
    '/users/:userId/role', 
    roleUpdateLimiter, 
    validate(roleUpdateSchema),
    adminController.updateUserRole
);

// Payout Management
router.get('/withdrawals', adminController.getPendingWithdrawals);
router.patch(
    '/withdrawals/:withdrawalId', 
    roleUpdateLimiter, 
    validate(processWithdrawalSchema), 
    adminController.processWithdrawal
);

module.exports = router;
