const asyncHandler = require('../utils/asyncHandler');
const passService = require('../services/pass.service');
const AppError = require('../utils/AppError');

const getAvailablePasses = asyncHandler(async (req, res) => {
    const { facility_id, vehicle_type } = req.query;

    if (!facility_id) {
        throw new AppError('facility_id is required', 400);
    }

    const passes = await passService.getAvailablePasses(facility_id, vehicle_type);

    res.status(200).json({ status: 'success', results: passes.length, data: passes });
});

const purchasePass = asyncHandler(async (req, res) => {
    const { facility_id, vehicle_type } = req.body;

    if (!facility_id || !vehicle_type) {
        throw new AppError('facility_id and vehicle_type are required', 400);
    }

    const pass = await passService.purchasePass(req.user.id, facility_id, vehicle_type);

    res.status(201).json({
        status: 'success',
        message: 'Monthly pass purchased successfully',
        data: pass
    });
});

const getMyPasses = asyncHandler(async (req, res) => {
    const passes = await passService.getActivePasses(req.user.id);

    res.status(200).json({ status: 'success', results: passes.length, data: passes });
});

module.exports = {
    getAvailablePasses,
    purchasePass,
    getMyPasses
};
