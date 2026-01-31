const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const analyticsService = require('../services/analytics.service');

// --- Facility Management ---

const updateFacility = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { name, operating_hours } = req.body;

    // Check ownership
    const facility = await prisma.parkingFacility.findUnique({ where: { id } });
    if (!facility || facility.provider_id !== req.user.id) {
        return next(new AppError('Facility not found or access denied', 404));
    }

    const updated = await prisma.parkingFacility.update({
        where: { id },
        data: { name, operating_hours }
    });

    res.status(200).json({ status: 'success', data: updated });
});

const deleteFacility = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const facility = await prisma.parkingFacility.findUnique({ where: { id } });
    if (!facility || facility.provider_id !== req.user.id) {
        return next(new AppError('Facility not found or access denied', 404));
    }

    // Soft delete
    await prisma.parkingFacility.update({
        where: { id },
        data: { is_active: false }
    });

    res.status(204).json({ status: 'success', data: null });
});

// --- Slot Management ---

const bulkCreateSlots = asyncHandler(async (req, res, next) => {
    const { floorId } = req.params;
    const slots = req.body; // Array of objects

    const floor = await prisma.floor.findUnique({
        where: { id: floorId },
        include: { facility: true }
    });

    if (!floor || floor.facility.provider_id !== req.user.id) {
        return next(new AppError('Floor not found or access denied', 403));
    }

    if (!Array.isArray(slots) || slots.length === 0) {
        return next(new AppError('Invalid slots data', 400));
    }

    // Create
    const created = await prisma.parkingSlot.createMany({
        data: slots.map(s => ({
            floor_id: floorId,
            slot_number: s.slot_number,
            vehicle_type: s.vehicle_type,
            area_sqft: s.area_sqft
        }))
    });

    res.status(201).json({ status: 'success', message: `${created.count} slots created` });
});

const updateSlot = asyncHandler(async (req, res, next) => {
    const { slotId } = req.params;
    const { vehicle_type, area_sqft, is_active } = req.body;

    const slot = await prisma.parkingSlot.findUnique({
        where: { id: slotId },
        include: { floor: { include: { facility: true } } }
    });

    if (!slot || slot.floor.facility.provider_id !== req.user.id) {
        return next(new AppError('Slot not found or access denied', 404));
    }

    const updated = await prisma.parkingSlot.update({
        where: { id: slotId },
        data: { vehicle_type, area_sqft, is_active }
    });

    res.status(200).json({ status: 'success', data: updated });
});

const getFacilitySlots = asyncHandler(async (req, res, next) => {
    const { facilityId } = req.params;
    const { floor_id, vehicle_type, status } = req.query;

    const facility = await prisma.parkingFacility.findUnique({ where: { id: facilityId } });
    if (!facility || facility.provider_id !== req.user.id) {
        return next(new AppError('Facility not found or access denied', 404));
    }

    const where = {
        floor: { facility_id: facilityId }
    };
    if (floor_id) where.floor_id = floor_id;
    if (vehicle_type) where.vehicle_type = vehicle_type;
    if (status) where.status = status;

    const slots = await prisma.parkingSlot.findMany({
        where,
        orderBy: { slot_number: 'asc' }
    });

    res.status(200).json({ status: 'success', results: slots.length, data: slots });
});

// --- Pricing ---

const setPricingRule = asyncHandler(async (req, res, next) => {
    const { facility_id, vehicle_type, hourly_rate, daily_max } = req.body;

    const facility = await prisma.parkingFacility.findUnique({ where: { id: facility_id } });
    if (!facility || facility.provider_id !== req.user.id) {
        return next(new AppError('Facility not found', 404));
    }

    // Upsert rule
    // We don't have a unique constraint on (facility_id, vehicle_type) in schema yet, 
    // assuming logical uniqueness or handled here.
    // Ideally schema should have @@unique([facility_id, vehicle_type])
    // Checking first:

    const existing = await prisma.pricingRule.findFirst({
        where: { facility_id, vehicle_type }
    });

    let result;
    if (existing) {
        result = await prisma.pricingRule.update({
            where: { id: existing.id },
            data: { hourly_rate, daily_max }
        });
    } else {
        result = await prisma.pricingRule.create({
            data: { facility_id, vehicle_type, hourly_rate, daily_max }
        });
    }

    res.status(200).json({ status: 'success', data: result });
});

const getFacilityPricing = asyncHandler(async (req, res, next) => {
    const { facilityId } = req.params;

    const facility = await prisma.parkingFacility.findUnique({
        where: { id: facilityId },
        include: { pricing_rules: true }
    });

    if (!facility || facility.provider_id !== req.user.id) {
        return next(new AppError('Facility not found or access denied', 404));
    }

    res.status(200).json({ status: 'success', data: facility.pricing_rules });
});

// --- Analytics ---

const getStats = asyncHandler(async (req, res) => {
    const stats = await analyticsService.getDashboardStats(req.user.id);
    res.status(200).json({ status: 'success', data: stats });
});

const getRevenueReport = asyncHandler(async (req, res) => {
    // Simple implementation: getting completed tickets for provider

    // Find all facility IDs for this provider
    const facilities = await prisma.parkingFacility.findMany({
        where: { provider_id: req.user.id },
        select: { id: true }
    });
    const ids = facilities.map(f => f.id);

    const tickets = await prisma.ticket.findMany({
        where: {
            slot: { floor: { facility_id: { in: ids } } },
            status: 'COMPLETED'
        },
        orderBy: { exit_time: 'desc' },
        take: 100 // Pagination needed in real app
    });

    // Check for CSV export request
    if (req.query.format === 'csv') {
        const csvContent = tickets.map(t => `${t.id},${t.vehicle_number},${t.total_fee},${t.exit_time}`).join('\n');
        res.header('Content-Type', 'text/csv');
        res.attachment('revenue_report.csv');
        return res.send(`TicketID,Vehicle,Amount,Date\n${csvContent}`);
    }

    res.status(200).json({ status: 'success', results: tickets.length, data: tickets });
});

const getLiveStatus = asyncHandler(async (req, res, next) => {
    const { facilityId } = req.params;

    const facility = await prisma.parkingFacility.findUnique({ where: { id: facilityId } });
    if (!facility || facility.provider_id !== req.user.id) {
        return next(new AppError('Facility not found or access denied', 404));
    }

    // Occupancy per floor
    const floors = await prisma.floor.findMany({
        where: { facility_id: facilityId },
        include: {
            _count: {
                select: {
                    parking_slots: { where: { status: 'OCCUPIED' } }
                }
            }
        }
    });

    // Available by type
    const availableByType = await prisma.parkingSlot.groupBy({
        by: ['vehicle_type'],
        where: {
            floor: { facility_id: facilityId },
            status: 'FREE',
            is_active: true
        },
        _count: { id: true }
    });

    // Active Tickets
    const activeTickets = await prisma.ticket.findMany({
        where: {
            slot: { floor: { facility_id: facilityId } },
            status: 'ACTIVE'
        },
        select: { id: true, vehicle_number: true, entry_time: true, slot: { select: { slot_number: true } } }
    });

    res.status(200).json({
        status: 'success',
        data: {
            floors: floors.map(f => ({
                id: f.id,
                name: f.floor_name || `Floor ${f.floor_number}`,
                occupied_count: f._count.parking_slots
            })),
            available_by_type: availableByType,
            active_tickets: activeTickets
        }
    });
});

module.exports = {
    updateFacility,
    deleteFacility,
    bulkCreateSlots,
    updateSlot,
    getFacilitySlots,
    setPricingRule,
    getFacilityPricing,
    getStats,
    getRevenueReport,
    getLiveStatus
};
