const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const discoveryService = require('../services/discovery.service');
const cache = require('../utils/cache');

// --- DISCOVERY ---

const searchParking = asyncHandler(async (req, res) => {
    const { latitude, longitude, radius, vehicle_type, city } = req.query;

    if (!latitude || !longitude) {
        throw new AppError('Latitude and longitude are required', 400);
    }

    const cacheKey = `search_${latitude}_${longitude}_${radius}_${vehicle_type}_${city}`;
    let results = cache.get(cacheKey);

    if (!results) {
        results = await discoveryService.searchNearbyFacilities(
            latitude,
            longitude,
            parseFloat(radius) || 5,
            { vehicle_type, city }
        );
        cache.set(cacheKey, results, 60); // Cache for 1 minute
    }

    res.status(200).json({ status: 'success', results: results.length, data: results });
});

const getFacilityDetails = asyncHandler(async (req, res) => {
    const { facilityId } = req.params;

    const cacheKey = `facility_${facilityId}`;
    let facility = cache.get(cacheKey);

    if (!facility) {
        facility = await discoveryService.getFacilityDetails(facilityId);
        cache.set(cacheKey, facility, 120); // Cache for 2 minutes
    }

    res.status(200).json({ status: 'success', data: facility });
});

const getAvailableSlots = asyncHandler(async (req, res) => {
    const { facilityId } = req.params;
    const { floor_id, vehicle_type } = req.query;

    const slots = await discoveryService.getAvailableSlots(facilityId, { floor_id, vehicle_type });

    res.status(200).json({ status: 'success', data: slots });
});

// --- PROFILE ---

const getProfile = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            email: true,
            full_name: true,
            phone_number: true,
            role: true,
            created_at: true
        }
    });

    res.status(200).json({ status: 'success', data: user });
});

const updateProfile = asyncHandler(async (req, res) => {
    const { full_name, phone_number } = req.body;

    const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: { full_name, phone_number },
        select: {
            id: true,
            email: true,
            full_name: true,
            phone_number: true
        }
    });

    res.status(200).json({ status: 'success', data: updated });
});

// --- VEHICLES ---

const getVehicles = asyncHandler(async (req, res) => {
    const vehicles = await prisma.vehicle.findMany({
        where: { user_id: req.user.id },
        orderBy: { created_at: 'desc' }
    });

    res.status(200).json({ status: 'success', results: vehicles.length, data: vehicles });
});

const addVehicle = asyncHandler(async (req, res) => {
    const { vehicle_number, vehicle_type, nickname } = req.body;

    const vehicle = await prisma.vehicle.create({
        data: {
            user_id: req.user.id,
            vehicle_number,
            vehicle_type,
            nickname
        }
    });

    res.status(201).json({ status: 'success', data: vehicle });
});

const deleteVehicle = asyncHandler(async (req, res) => {
    const { vehicleId } = req.params;

    // Verify ownership
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle || vehicle.user_id !== req.user.id) {
        throw new AppError('Vehicle not found', 404);
    }

    await prisma.vehicle.delete({ where: { id: vehicleId } });

    res.status(204).json({ status: 'success', data: null });
});

// --- FAVORITES ---

const addFavorite = asyncHandler(async (req, res) => {
    const { facilityId } = req.params;

    // Check if facility exists
    const facility = await prisma.parkingFacility.findUnique({ where: { id: facilityId } });
    if (!facility) {
        throw new AppError('Facility not found', 404);
    }

    // Create or get existing
    const favorite = await prisma.favorite.upsert({
        where: {
            user_id_facility_id: {
                user_id: req.user.id,
                facility_id: facilityId
            }
        },
        update: {},
        create: {
            user_id: req.user.id,
            facility_id: facilityId
        },
        include: {
            facility: {
                select: { name: true, address: true, city: true }
            }
        }
    });

    res.status(201).json({ status: 'success', data: favorite });
});

const removeFavorite = asyncHandler(async (req, res) => {
    const { facilityId } = req.params;

    await prisma.favorite.deleteMany({
        where: {
            user_id: req.user.id,
            facility_id: facilityId
        }
    });

    res.status(204).json({ status: 'success', data: null });
});

const getFavorites = asyncHandler(async (req, res) => {
    const favorites = await prisma.favorite.findMany({
        where: { user_id: req.user.id },
        include: {
            facility: {
                select: {
                    id: true,
                    name: true,
                    address: true,
                    city: true,
                    image_url: true,
                    operating_hours: true
                }
            }
        },
        orderBy: { created_at: 'desc' }
    });

    res.status(200).json({ status: 'success', results: favorites.length, data: favorites });
});

module.exports = {
    searchParking,
    getFacilityDetails,
    getAvailableSlots,
    getProfile,
    updateProfile,
    getVehicles,
    addVehicle,
    deleteVehicle,
    addFavorite,
    removeFavorite,
    getFavorites
};
