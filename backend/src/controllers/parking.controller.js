const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const geocodingService = require('../services/geocoding.service');
const socketService = require('../services/socket.service');

// --- Facilities ---

const createFacility = asyncHandler(async (req, res, next) => {
    const { name, address, city, latitude, longitude, total_floors, operating_hours, description, image_url, is_active } = req.body;
    const provider_id = req.user.id;

    console.log(`[Provider ${provider_id}] Creating facility: ${name}`);

    // Auto-geocode if lat/lng not provided
    let finalLatitude = latitude;
    let finalLongitude = longitude;

    if (!latitude || !longitude) {
        const coords = await geocodingService.geocodeAddress(address, city);
        if (coords) {
            finalLatitude = coords.latitude;
            finalLongitude = coords.longitude;
        }
    }

    const facility = await prisma.parkingFacility.create({
        data: {
            provider_id,
            name,
            address,
            city,
            latitude: finalLatitude ? parseFloat(finalLatitude) : null,
            longitude: finalLongitude ? parseFloat(finalLongitude) : null,
            total_floors: parseInt(total_floors, 10) || 1,
            operating_hours,
            description,
            is_active: is_active !== undefined ? is_active : true,
            image_url
        },
    });

    console.log(`[Socket] Notifying provider ${provider_id} of new facility`);
    socketService.emitToProvider(provider_id, 'facility_created', facility);

    res.status(201).json({ status: 'success', data: facility });
});


const getMyFacilities = asyncHandler(async (req, res) => {
    const facilities = await prisma.parkingFacility.findMany({
        where: { 
            provider_id: req.user.id,
            is_active: true 
        },
        include: { 
            floors: {
                include: {
                    _count: {
                        select: { parking_slots: true }
                    }
                }
            } 
        },
    });

    const formattedFacilities = facilities.map(f => {
        let total = 0;
        if (f.floors) {
            total = f.floors.reduce((acc, floor) => acc + (floor._count?.parking_slots || 0), 0);
        }
        return {
            ...f,
            total_slots: total
        };
    });

    res.status(200).json({ status: 'success', results: formattedFacilities.length, data: formattedFacilities });
});

const getAllFacilities = asyncHandler(async (req, res) => {
    const { city, vehicle_type } = req.query;
    const where = { is_active: true };

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
    const { floor_number, floor_name } = req.body;
    const facility_id = req.body.facility_id || req.params.facilityId;

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
