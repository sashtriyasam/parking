const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const axios = require('axios');
const logger = require('../utils/logger');

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Get real road distance using Google Distance Matrix API
 */
const getRealDistances = async (origin, destinations) => {
    if (!GOOGLE_API_KEY || !destinations.length) return null;

    try {
        const destString = destinations.map(d => `${d.lat},${d.lng}`).join('|');
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destString}&key=${GOOGLE_API_KEY}`;

        const response = await axios.get(url);

        if (response.data.status !== 'OK') return null;

        return response.data.rows[0].elements.map(el => {
            if (el.status === 'OK') {
                return {
                    distance_text: el.distance.text,
                    distance_value: el.distance.value / 1000, // convert meters to km
                    duration_text: el.duration.text
                };
            }
            return null;
        });
    } catch (error) {
        logger.error('Distance Matrix API Error:', error.message);
        return null;
    }
};

/**
 * Haversine formula to calculate distance between two points
 * @returns distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Search nearby parking facilities
 */
const searchNearbyFacilities = async (latitude, longitude, radius = 5, filters = {}) => {
    const { vehicle_type, city } = filters;

    // Build where clause
    const where = { is_active: true };
    if (city) where.city = city;

    // Get all facilities (filtered by city if provided)
    const facilities = await prisma.parkingFacility.findMany({
        where,
        include: {
            floors: {
                include: {
                    parking_slots: {
                        where: {
                            is_active: true,
                            ...(vehicle_type && { vehicle_type })
                        }
                    }
                }
            },
            pricing_rules: true
        }
    });

    // Calculate distance and filter by radius
    const withinRadius = facilities
        .map(facility => {
            if (!facility.latitude || !facility.longitude) return null;

            const distance = calculateDistance(
                parseFloat(latitude),
                parseFloat(longitude),
                parseFloat(facility.latitude),
                parseFloat(facility.longitude)
            );

            if (distance > radius) return null;
            return { ...facility, haversine_dist: distance };
        })
        .filter(f => f !== null);

    // Get real distances from Google for those within radius
    const destinations = withinRadius.map(f => ({ lat: f.latitude, lng: f.longitude }));
    const realDistances = await getRealDistances({ lat: latitude, lng: longitude }, destinations);

    const results = withinRadius.map((facility, index) => {
        const real = realDistances ? realDistances[index] : null;

        // Calculate available slots
        const availableSlots = {};
        let totalAvailable = 0;

        facility.floors.forEach(floor => {
            floor.parking_slots.forEach(slot => {
                if (slot.status === 'FREE') {
                    availableSlots[slot.vehicle_type] = (availableSlots[slot.vehicle_type] || 0) + 1;
                    totalAvailable++;
                }
            });
        });

        const pricing = facility.pricing_rules.find(r => r.vehicle_type === vehicle_type);

        return {
            id: facility.id,
            name: facility.name,
            address: facility.address,
            city: facility.city,
            latitude: facility.latitude,
            longitude: facility.longitude,
            distance: real ? real.distance_value : Math.round(facility.haversine_dist * 10) / 10,
            distance_text: real ? real.distance_text : `${(Math.round(facility.haversine_dist * 10) / 10)} km`,
            duration_text: real ? real.duration_text : null,
            operating_hours: facility.operating_hours,
            available_slots: availableSlots,
            total_available: totalAvailable,
            pricing: pricing ? {
                hourly_rate: pricing.hourly_rate,
                daily_max: pricing.daily_max
            } : null
        };
    }).sort((a, b) => a.distance - b.distance);

    return results;
};

/**
 * Get detailed facility information
 */
const getFacilityDetails = async (facilityId) => {
    const facility = await prisma.parkingFacility.findUnique({
        where: { id: facilityId },
        include: {
            floors: {
                include: {
                    parking_slots: {
                        where: { is_active: true }
                    }
                },
                orderBy: { floor_number: 'asc' }
            },
            pricing_rules: true
        }
    });

    if (!facility) {
        throw new AppError('Facility not found', 404);
    }

    // Aggregate slot stats
    const slotStats = {};
    facility.floors.forEach(floor => {
        floor.parking_slots.forEach(slot => {
            if (!slotStats[slot.vehicle_type]) {
                slotStats[slot.vehicle_type] = { total: 0, available: 0, occupied: 0 };
            }
            slotStats[slot.vehicle_type].total++;
            if (slot.status === 'FREE') slotStats[slot.vehicle_type].available++;
            if (slot.status === 'OCCUPIED') slotStats[slot.vehicle_type].occupied++;
        });
    });

    return {
        ...facility,
        slot_stats: slotStats
    };
};

/**
 * Get available slots for visual grid
 */
const getAvailableSlots = async (facilityId, filters = {}) => {
    const { floor_id, vehicle_type } = filters;

    const where = {
        floor: { facility_id: facilityId },
        is_active: true
    };

    if (floor_id) where.floor_id = floor_id;
    if (vehicle_type) where.vehicle_type = vehicle_type;

    const slots = await prisma.parkingSlot.findMany({
        where,
        include: {
            floor: {
                select: { floor_number: true, floor_name: true }
            }
        },
        orderBy: [
            { floor_id: 'asc' },
            { slot_number: 'asc' }
        ]
    });

    // Group by floor
    const slotsByFloor = {};
    slots.forEach(slot => {
        const floorKey = slot.floor.floor_name || `Floor ${slot.floor.floor_number}`;
        if (!slotsByFloor[floorKey]) slotsByFloor[floorKey] = [];
        slotsByFloor[floorKey].push({
            id: slot.id,
            slot_number: slot.slot_number,
            vehicle_type: slot.vehicle_type,
            status: slot.status,
            area_sqft: slot.area_sqft
        });
    });

    return slotsByFloor;
};

module.exports = {
    searchNearbyFacilities,
    getFacilityDetails,
    getAvailableSlots
};
