const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// --- Facilities ---

const createFacility = asyncHandler(async (req, res, next) => {
    const { name, address, city, latitude, longitude, total_floors, operating_hours, image_url } = req.body;
    const provider_id = req.user.id;

    const facility = await prisma.parkingFacility.create({
        data: {
            provider_id,
            name,
            address,
            city,
            latitude,
            longitude,
            total_floors,
            operating_hours,
            image_url
        },
    });

    res.status(201).json({ status: 'success', data: facility });
});

const getMyFacilities = asyncHandler(async (req, res) => {
    const facilities = await prisma.parkingFacility.findMany({
        where: { provider_id: req.user.id },
        include: { floors: true },
    });
    res.status(200).json({ status: 'success', results: facilities.length, data: facilities });
});

const getAllFacilities = asyncHandler(async (req, res) => {
    const { city, vehicle_type } = req.query;
    const where = {};

    if (city) where.city = { contains: city, mode: 'insensitive' };
    // If filtering by vehicle type, we'd need complex queries or just filter in memory/UI for now 
    // since vehicle type is on slots/pricing rules. 
    // Keeping it simple for now.

    const facilities = await prisma.parkingFacility.findMany({
        where,
        take: 50,
    });
    res.status(200).json({ status: 'success', results: facilities.length, data: facilities });
});

const getFacility = asyncHandler(async (req, res, next) => {
    const facility = await prisma.parkingFacility.findUnique({
        where: { id: req.params.id },
        include: {
            floors: {
                include: {
                    parking_slots: true
                }
            },
            pricing_rules: true
        },
    });

    if (!facility) return next(new AppError('No facility found with that ID', 404));

    res.status(200).json({ status: 'success', data: facility });
});

// --- Floors ---

const addFloor = asyncHandler(async (req, res, next) => {
    const { facility_id, floor_number, floor_name } = req.body;

    // Verify ownership
    const facility = await prisma.parkingFacility.findUnique({ where: { id: facility_id } });
    if (!facility || facility.provider_id !== req.user.id) {
        return next(new AppError('Facility not found or access denied', 403));
    }

    const floor = await prisma.floor.create({
        data: { facility_id, floor_number, floor_name },
    });

    res.status(201).json({ status: 'success', data: floor });
});

// --- Slots ---

const addSlots = asyncHandler(async (req, res, next) => {
    const { floor_id, slots } = req.body; // slots: [{ slot_number, vehicle_type, area_sqft }]

    // Validate floor ownership implicitly via relation or check upstream
    // For simplicity, checking floor existence:
    const floor = await prisma.floor.findUnique({
        where: { id: floor_id },
        include: { facility: true }
    });

    if (!floor || floor.facility.provider_id !== req.user.id) {
        return next(new AppError('Floor not found or access denied', 403));
    }

    // Bulk create
    await prisma.parkingSlot.createMany({
        data: slots.map(slot => ({
            floor_id,
            ...slot
        })),
    });

    res.status(201).json({ status: 'success', message: 'Slots created successfully' });
});

const getFloorSlots = asyncHandler(async (req, res) => {
    const slots = await prisma.parkingSlot.findMany({
        where: { floor_id: req.params.floorId },
        orderBy: { slot_number: 'asc' }
    });
    res.status(200).json({ status: 'success', data: slots });
});

module.exports = {
    createFacility,
    getMyFacilities,
    getAllFacilities,
    getFacility,
    addFloor,
    addSlots,
    getFloorSlots
};
