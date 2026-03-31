const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const analyticsService = require('../services/analytics.service');
const logger = require('../utils/logger');

// --- Facility Management ---

const updateFacility = asyncHandler(async (req, res, next) => {
    const { facilityId } = req.params;
    const { name, operating_hours } = req.body;

    // Check ownership
    const facility = await prisma.parkingFacility.findUnique({ where: { id: facilityId } });
    if (!facility || facility.provider_id !== req.user.id) {
        return next(new AppError('Facility not found or access denied', 404));
    }

    const updated = await prisma.parkingFacility.update({
        where: { id: facilityId },
        data: { name, operating_hours }
    });

    res.status(200).json({ status: 'success', data: updated });
});

const deleteFacility = asyncHandler(async (req, res, next) => {
    const { facilityId } = req.params;

    const facility = await prisma.parkingFacility.findUnique({ where: { id: facilityId } });
    if (!facility || facility.provider_id !== req.user.id) {
        return next(new AppError('Facility not found or access denied', 404));
    }

    // Soft delete
    await prisma.parkingFacility.update({
        where: { id: facilityId },
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

// --- New Dashboard Endpoints ---

const getRevenueData = asyncHandler(async (req, res) => {
    const { period = '7d' } = req.query;
    const providerId = req.user.id;

    // Calculate start date based on period
    const now = new Date();
    let startDate = new Date();

    switch (period) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
        case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
        default:
            startDate.setDate(now.getDate() - 7);
    }

    // Get facility IDs for this provider
    const facilities = await prisma.parkingFacility.findMany({
        where: { provider_id: providerId },
        select: { id: true }
    });
    const facilityIds = facilities.map(f => f.id);

    if (facilityIds.length === 0) {
        return res.status(200).json({ status: 'success', data: [] });
    }

    // Get completed tickets grouped by date and vehicle type
    const tickets = await prisma.ticket.findMany({
        where: {
            slot: { floor: { facility_id: { in: facilityIds } } },
            status: 'COMPLETED',
            exit_time: { gte: startDate }
        },
        select: {
            exit_time: true,
            vehicle_type: true,
            total_fee: true
        }
    });

    // Group by date and vehicle type
    const revenueByDate = {};
    tickets.forEach(ticket => {
        const date = ticket.exit_time.toISOString().split('T')[0];
        if (!revenueByDate[date]) {
            revenueByDate[date] = { date, CAR: 0, BIKE: 0, SCOOTER: 0, TRUCK: 0 };
        }
        
        // Defensive fix: Handle missing vehicleType before toUpperCase
        const vehicleKey = (ticket.vehicle_type || 'UNKNOWN').toUpperCase();
        
        // Ensure the bucket exists for this dynamic/normalized type
        if (revenueByDate[date][vehicleKey] === undefined) {
            revenueByDate[date][vehicleKey] = 0;
        }
        
        revenueByDate[date][vehicleKey] += Number(ticket.total_fee || 0);
    });

    const revenueData = Object.values(revenueByDate).sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    res.status(200).json({ status: 'success', data: revenueData });
});

const getOccupancyData = asyncHandler(async (req, res) => {
    const providerId = req.user.id;

    // Get all facilities with floors
    const facilities = await prisma.parkingFacility.findMany({
        where: { provider_id: providerId },
        include: {
            floors: {
                include: {
                    parking_slots: {
                        select: {
                            id: true,
                            status: true
                        }
                    }
                }
            }
        }
    });

    // Transform to occupancy data
    const occupancyData = [];
    facilities.forEach(facility => {
        facility.floors.forEach(floor => {
            const totalSlots = floor.parking_slots.length;
            const occupiedSlots = floor.parking_slots.filter(s => s.status === 'OCCUPIED').length;

            occupancyData.push({
                floor_id: floor.id,
                floor_number: floor.floor_number,
                facility_name: facility.name,
                total_slots: totalSlots,
                occupied_slots: occupiedSlots,
                occupancy_rate: totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0
            });
        });
    });

    res.status(200).json({ status: 'success', data: occupancyData });
});

const getRecentBookings = asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 5, 100);
    const providerId = req.user.id;

    // Get facility IDs
    const facilities = await prisma.parkingFacility.findMany({
        where: { provider_id: providerId },
        select: { id: true }
    });
    const facilityIds = facilities.map(f => f.id);

    if (facilityIds.length === 0) {
        return res.status(200).json({ status: 'success', data: [] });
    }

    const bookings = await prisma.ticket.findMany({
        where: {
            slot: { floor: { facility_id: { in: facilityIds } } }
        },
        include: {
            slot: { select: { slot_number: true } },
            customer: { select: { full_name: true } }
        },
        orderBy: { created_at: 'desc' },
        take: Number(limit)
    });

    // Transform to match frontend interface
    const transformedBookings = bookings.map(booking => ({
        id: booking.id,
        ticket_id: booking.id,
        customer_name: booking.customer?.full_name || 'Unknown',
        vehicle_number: booking.vehicle_number,
        vehicle_type: booking.vehicle_type,
        slot_number: booking.slot?.slot_number || 'N/A',
        entry_time: booking.entry_time,
        amount: booking.total_fee || 0,
        status: booking.status.toLowerCase()
    }));

    res.status(200).json({ status: 'success', data: transformedBookings });
});

const getFacilityDetails = asyncHandler(async (req, res, next) => {
    const { facilityId } = req.params;

    const facility = await prisma.parkingFacility.findUnique({
        where: { id: facilityId },
        include: {
            floors: {
                include: {
                    parking_slots: true
                }
            }
        }
    });

    if (!facility || facility.provider_id !== req.user.id) {
        return next(new AppError('Facility not found or access denied', 404));
    }

    // Calculate total slots
    const totalSlots = facility.floors.reduce((sum, floor) =>
        sum + floor.parking_slots.length, 0
    );

    // Calculate occupied slots
    const occupiedSlots = facility.floors.reduce((sum, floor) =>
        sum + floor.parking_slots.filter(s => s.status === 'OCCUPIED').length, 0
    );

    // Calculate today's revenue
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayRevenue = await prisma.ticket.aggregate({
        where: {
            slot: { floor: { facility_id: facilityId } },
            created_at: { gte: todayStart },
            status: 'COMPLETED'
        },
        _sum: { total_fee: true }
    });

    // Remove floors from response, add computed fields
    const { floors, ...facilityData } = facility;

    res.status(200).json({
        status: 'success',
        data: {
            ...facilityData,
            _count: { parking_slots: totalSlots },
            slots: totalSlots,
            occupancy: totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0,
            revenue: todayRevenue._sum.total_fee || 0
        }
    });
});

const deleteSlot = asyncHandler(async (req, res, next) => {
    const { slotId } = req.params;

    const slot = await prisma.parkingSlot.findUnique({
        where: { id: slotId },
        include: { floor: { include: { facility: true } } }
    });

    if (!slot || slot.floor.facility.provider_id !== req.user.id) {
        return next(new AppError('Slot not found or access denied', 404));
    }

    // Check if slot is occupied or reserved
    if (slot.status === 'OCCUPIED' || slot.status === 'RESERVED') {
        return next(new AppError('Cannot delete occupied or reserved slot', 400));
    }

    await prisma.parkingSlot.delete({ where: { id } });

    res.status(204).json({ status: 'success', data: null });
});

const bulkCreateSlotsByFacility = asyncHandler(async (req, res, next) => {
    const { facilityId } = req.params;
    const { floor_number, vehicle_type, start_number, count, prefix } = req.body;

    logger.debug(`bulkCreate: ${JSON.stringify({ facilityId, floor_number, vehicle_type, start_number, count, prefix })}`);

    // Verify ownership
    const facility = await prisma.parkingFacility.findUnique({
        where: { id: facilityId }
    });

    if (!facility || facility.provider_id !== req.user.id) {
        return next(new AppError('Facility not found or access denied', 404));
    }

    logger.debug(`Facility found: ${facility.id}`);

    // Find or create floor
    let floor = await prisma.floor.findFirst({
        where: { facility_id: facilityId, floor_number: parseInt(floor_number) }
    });

    if (!floor) {
        logger.debug('Creating new floor');
        floor = await prisma.floor.create({
            data: {
                facility_id: facilityId,
                floor_number: parseInt(floor_number),
                floor_name: `Floor ${floor_number}`
            }
        });
    }

    logger.debug(`Floor: ${floor.id}`);

    // Generate slot data
    const slots = [];
    const slotPrefix = prefix ? prefix.toUpperCase() : '';

    for (let i = 0; i < parseInt(count); i++) {
        slots.push({
            floor_id: floor.id,
            slot_number: `${slotPrefix}${parseInt(start_number) + i}`,
            vehicle_type: vehicle_type.toUpperCase(),
            status: 'FREE',
            is_active: true
        });
    }

    logger.debug(`Slots to create: ${slots.length}, Sample: ${JSON.stringify(slots[0])}`);

    // Use transaction with individual creates for SQLite compatibility
    const createdSlots = await prisma.$transaction(
        slots.map(slot => prisma.parkingSlot.create({ data: slot }))
    );

    logger.debug(`Created: ${createdSlots.length}`);

    res.status(201).json({
        status: 'success',
        message: `${createdSlots.length} slots created`,
        data: { floor_id: floor.id, created_count: createdSlots.length }
    });
});

const getAllBookings = asyncHandler(async (req, res) => {
    const { status, facility_id, start_date, end_date } = req.query;
    const providerId = req.user.id;

    // Get facility IDs for this provider
    const facilities = await prisma.parkingFacility.findMany({
        where: { provider_id: providerId },
        select: { id: true }
    });
    const facilityIds = facilities.map(f => f.id);

    if (facilityIds.length === 0) {
        return res.status(200).json({ status: 'success', results: 0, data: [] });
    }

    // Build where clause
    const where = {
        slot: {
            floor: {
                facility_id: { in: facilityIds }
            }
        }
    };

    if (status && status !== 'all') {
        where.status = status.toUpperCase();
    }

    if (facility_id && facility_id !== 'all') {
        // AI TEST: Horizontal Privilege Escalation Guard
        if (!facilityIds.includes(facility_id)) {
            return res.status(403).json({
                status: 'error',
                message: 'Unauthorized access to this facility'
            });
        }
        where.slot.floor.facility_id = facility_id;
    }

    if (start_date || end_date) {
        where.created_at = {};
        if (start_date) where.created_at.gte = new Date(start_date);
        if (end_date) {
            const endDateTime = new Date(end_date);
            endDateTime.setHours(23, 59, 59, 999);
            where.created_at.lte = endDateTime;
        }
    }

    const bookings = await prisma.ticket.findMany({
        where,
        include: {
            slot: { select: { slot_number: true } },
            customer: { select: { full_name: true } }
        },
        orderBy: { created_at: 'desc' }
    });

    // Transform to frontend format
    const transformedBookings = bookings.map(booking => ({
        id: booking.id,
        ticket_id: booking.id,
        customer_name: booking.customer?.full_name || 'Unknown',
        vehicle_number: booking.vehicle_number,
        vehicle_type: booking.vehicle_type,
        slot_number: booking.slot?.slot_number || 'N/A',
        entry_time: booking.entry_time,
        amount: booking.total_fee || 0,
        status: booking.status.toLowerCase()
    }));

    res.status(200).json({
        status: 'success',
        results: transformedBookings.length,
        data: transformedBookings
    });
});

const updateFacilityPricing = asyncHandler(async (req, res, next) => {
    const { facilityId } = req.params;
    const { car_hourly, bike_hourly, scooter_hourly, truck_hourly } = req.body;

    const facility = await prisma.parkingFacility.findUnique({
        where: { id: facilityId }
    });

    if (!facility || facility.provider_id !== req.user.id) {
        return next(new AppError('Facility not found or access denied', 404));
    }

    // Atomically upsert pricing rules in a single transaction
    const upsertPromises = vehicleTypes
        .filter(({ rate }) => rate !== undefined && rate !== null && rate !== '')
        .map(({ type, rate }) => {
            const hourlyRate = parseFloat(rate);
            return prisma.pricingRule.upsert({
                where: {
                    facility_id_vehicle_type: {
                        facility_id: facilityId,
                        vehicle_type: type
                    }
                },
                update: { hourly_rate: hourlyRate },
                create: {
                    facility_id: facilityId,
                    vehicle_type: type,
                    hourly_rate: hourlyRate
                }
            });
        });

    if (upsertPromises.length > 0) {
        await prisma.$transaction(upsertPromises);
    }

    res.status(200).json({ status: 'success', message: 'Pricing updated successfully' });
});

// --- Number Plate Checker ---

/**
 * Check vehicle by plate number
 * Returns active ticket, current fee, duration, and history
 */
const checkVehicleByPlate = asyncHandler(async (req, res, next) => {
    const { vehicle_number } = req.query;
    const providerId = req.user.id;

    if (!vehicle_number) {
        return next(new AppError('Vehicle number is required', 400));
    }

    // Normalize plate number (uppercase, remove spaces)
    const normalizedPlate = vehicle_number.toUpperCase().replace(/\s/g, '');

    // Get provider's facility IDs
    const facilities = await prisma.parkingFacility.findMany({
        where: { provider_id: providerId },
        select: { id: true, name: true }
    });
    const facilityIds = facilities.map(f => f.id);

    if (facilityIds.length === 0) {
        return res.status(200).json({
            status: 'success',
            data: { found: false, message: 'No facilities found for this provider' }
        });
    }

    // Find active ticket for this vehicle at provider's facilities
    const activeTicket = await prisma.ticket.findFirst({
        where: {
            vehicle_number: { contains: normalizedPlate, mode: 'insensitive' },
            facility_id: { in: facilityIds },
            status: 'ACTIVE'
        },
        include: {
            slot: {
                include: {
                    floor: true
                }
            },
            facility: {
                select: { name: true, pricing_rules: true }
            }
        }
    });

    // Calculate current fee if active
    let currentFee = 0;
    let durationMinutes = 0;

    if (activeTicket) {
        const now = new Date();
        const entryTime = new Date(activeTicket.entry_time);
        durationMinutes = Math.round((now - entryTime) / (1000 * 60));

        // Get pricing for this vehicle type
        const pricingRule = activeTicket.facility.pricing_rules.find(
            r => r.vehicle_type === activeTicket.vehicle_type
        );

        if (pricingRule) {
            const hours = Math.ceil(durationMinutes / 60);
            currentFee = hours * pricingRule.hourly_rate;
            if (pricingRule.daily_max && currentFee > pricingRule.daily_max) {
                currentFee = pricingRule.daily_max;
            }
        }
    }

    // Get parking history at provider's facilities
    const history = await prisma.ticket.findMany({
        where: {
            vehicle_number: { contains: normalizedPlate, mode: 'insensitive' },
            facility_id: { in: facilityIds },
            status: { in: ['COMPLETED', 'CANCELLED'] }
        },
        orderBy: { entry_time: 'desc' },
        take: 10,
        include: {
            facility: { select: { name: true } },
            slot: { select: { slot_number: true } }
        }
    });

    res.status(200).json({
        status: 'success',
        data: {
            found: !!activeTicket,
            vehicle_number: normalizedPlate,
            active_ticket: activeTicket ? {
                id: activeTicket.id,
                slot: activeTicket.slot.slot_number,
                floor: activeTicket.slot.floor.floor_name,
                facility: activeTicket.facility.name,
                vehicle_type: activeTicket.vehicle_type,
                entry_time: activeTicket.entry_time,
                duration_minutes: durationMinutes,
                current_fee: currentFee
            } : null,
            history: history.map(t => ({
                id: t.id,
                facility: t.facility.name,
                slot: t.slot?.slot_number,
                entry_time: t.entry_time,
                exit_time: t.exit_time,
                total_fee: t.total_fee,
                status: t.status
            }))
        }
    });
});


/**
 * Consolidated analytics for the mobile charts
 */
const getAnalytics = asyncHandler(async (req, res) => {
    const providerId = req.user.id;
    
    // 1. Get basic stats from service
    const stats = await analyticsService.getDashboardStats(providerId);
    
    // 2. Get facilities
    const facilities = await prisma.parkingFacility.findMany({
        where: { provider_id: providerId },
        select: { id: true }
    });
    const ids = facilities.map(f => f.id);

    // 3. Get 7-Day Trend Data
    const trend = await analyticsService.getTrendData(providerId, 7);
    
    // 4. Vehicle Distribution
    const tickets = await prisma.ticket.groupBy({
        by: ['vehicle_type'],
        where: { facility_id: { in: ids } },
        _count: { id: true }
    });

    const vehicles = tickets.map(t => ({
        name: t.vehicle_type,
        population: t._count.id,
        color: t.vehicle_type === 'CAR' ? '#3B82F6' : t.vehicle_type === 'BIKE' ? '#10B981' : '#F59E0B',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
    }));

    res.status(200).json({
        status: 'success',
        data: {
            stats: stats,
            revenue: trend.revenue,
            occupancy: trend.occupancy,
            labels: trend.labels,
            sampleData: !trend.hasData, // Flag for synthetic data (only if no DB data exists)
            vehicles: vehicles.length > 0 ? vehicles : [
                { name: 'Cars', population: 0, color: '#3B82F6' },
                { name: 'Bikes', population: 0, color: '#10B981' }
            ]
        }
    });
});

/**
 * Get financial earnings, trend and history for provider
 */
const getEarnings = asyncHandler(async (req, res, next) => {
    const providerId = req.user.id;

    // 1. Get facility IDs
    const facilities = await prisma.parkingFacility.findMany({
        where: { provider_id: providerId },
        select: { id: true }
    });
    const facilityIds = facilities.map(f => f.id);

    if (facilityIds.length === 0) {
        return res.status(200).json({
            status: 'success',
            data: {
                totalRevenue: 0,
                withdrawableBalance: 0,
                pendingSettlements: 0,
                thisMonthRevenue: 0,
                trend: { labels: [], data: [0, 0, 0, 0, 0, 0] },
                history: []
            }
        });
    }

    // 2. Aggregate data
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalAgg, monthAgg, history] = await Promise.all([
        prisma.ticket.aggregate({
            where: { facility_id: { in: facilityIds }, status: 'COMPLETED' },
            _sum: { total_fee: true }
        }),
        prisma.ticket.aggregate({
            where: { 
                facility_id: { in: facilityIds }, 
                status: 'COMPLETED',
                created_at: { gte: monthStart }
            },
            _sum: { total_fee: true }
        }),
        prisma.ticket.findMany({
            where: { facility_id: { in: facilityIds }, status: 'COMPLETED' },
            orderBy: { created_at: 'desc' },
            take: 15,
            select: { id: true, total_fee: true, created_at: true, payment_method: true, status: true }
        })
    ]);

    // 3. 6-Month Trend (Optimized: Single query to prevent N+1 bottleneck)
    const months = [];
    const trendData = [];
    const trendKeyMap = {};
    
    // Pre-calculate month buckets
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        
        months.push(monthName);
        trendData.push(0);
        trendKeyMap[key] = months.length - 1; // Map YYYY-MM to array index
    }

    const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const historicalTickets = await prisma.ticket.findMany({
        where: {
            facility_id: { in: facilityIds },
            status: 'COMPLETED',
            created_at: { gte: sixMonthStart }
        },
        select: { total_fee: true, created_at: true }
    });

    historicalTickets.forEach(ticket => {
        const key = `${ticket.created_at.getFullYear()}-${ticket.created_at.getMonth()}`;
        if (trendKeyMap[key] !== undefined) {
            const index = trendKeyMap[key];
            trendData[index] += Number(ticket.total_fee || 0);
        }
    });

    // 4. Pending Settlements (Sum of PENDING settlements if we use them, otherwise 0)
    // For now, using balance directly as withdrawable
    const user = await prisma.user.findUnique({
        where: { id: providerId },
        select: { balance: true }
    });

    if (!user) {
        return next(new AppError('Provider account not found', 404));
    }

    const pendingWithdrawalsAgg = await prisma.withdrawal.aggregate({
        where: { provider_id: providerId, status: 'PENDING' },
        _sum: { amount: true }
    });

    res.status(200).json({
        status: 'success',
        data: {
            totalRevenue: Number(totalAgg._sum.total_fee || 0),
            withdrawableBalance: Number(user.balance || 0),
            pendingWithdrawals: Number(pendingWithdrawalsAgg._sum.amount || 0),
            thisMonthRevenue: Number(monthAgg._sum.total_fee || 0),
            trend: {
                labels: months,
                data: trendData
            },
            history: history.map(h => ({
                id: h.id,
                amount: Number(h.total_fee || 0),
                created_at: h.created_at,
                status: h.status ? h.status.toUpperCase() : 'SUCCESS',
                method: h.payment_method || 'Razorpay'
            }))
        }
    });
});

/**
 * Request a withdrawal (payout)
 */
const requestWithdrawal = asyncHandler(async (req, res, next) => {
    const { amount, payout_method, payout_details } = req.body;
    const providerId = req.user.id;

    if (!amount || amount <= 0) {
        return next(new AppError('Invalid withdrawal amount', 400));
    }

    // 2. Atomic withdrawal creation and balance decrement
    const withdrawal = await prisma.$transaction(async (tx) => {
        // A. Check current balance INSIDE transaction to prevent race conditions
        const user = await tx.user.findUnique({
            where: { id: providerId },
            select: { balance: true }
        });

        if (!user) {
            throw new AppError('Provider account not found', 404);
        }

        if (parseFloat(user.balance || 0) < amount) {
            throw new AppError('Insufficient balance for withdrawal', 400);
        }

        // B. Create withdrawal record
        const w = await tx.withdrawal.create({
            data: {
                provider_id: providerId,
                amount: amount,
                status: 'PENDING',
                payout_method: payout_method || 'UPI',
                payout_details: JSON.stringify(payout_details || {})
            }
        });

        // C. Decrement balance
        await tx.user.update({
            where: { id: providerId },
            data: {
                balance: { decrement: amount }
            }
        });

        return w;
    });

    res.status(201).json({
        status: 'success',
        message: 'Withdrawal request submitted successfully',
        data: withdrawal
    });
});

/**
 * Get withdrawal history for provider
 */
const getWithdrawals = asyncHandler(async (req, res) => {
    const providerId = req.user.id;

    const withdrawals = await prisma.withdrawal.findMany({
        where: { provider_id: providerId },
        orderBy: { created_at: 'desc' }
    });

    res.status(200).json({
        status: 'success',
        results: withdrawals.length,
        data: withdrawals
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
    getLiveStatus,
    getRevenueData,
    getOccupancyData,
    getRecentBookings,
    getFacilityDetails,
    deleteSlot,
    bulkCreateSlotsByFacility,
    getAllBookings,
    updateFacilityPricing,
    checkVehicleByPlate,
    getAnalytics,
    getEarnings,
    requestWithdrawal,
    getWithdrawals
};

