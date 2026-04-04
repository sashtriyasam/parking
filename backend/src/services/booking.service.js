const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const { emitSlotUpdate, emitToProvider } = require('./socket.service');

/**
 * Check if a slot is available for a specific time window
 */
const isSlotAvailable = async (slotId, startTime, endTime, client = prisma) => {
    // 1. Check for overlapping tickets
    // Standard overlap: (entry_time < endTime) AND (exit_time > startTime OR exit_time IS NULL)
    const overlappingTicket = await client.ticket.findFirst({
        where: {
            slot_id: slotId,
            status: { in: ['ACTIVE', 'PENDING_PAYMENT', 'RESERVED'] },
            AND: [
                { entry_time: { lt: endTime } },
                {
                    OR: [
                        { exit_time: { gt: startTime } },
                        { exit_time: null }
                    ]
                }
            ]
        }
    });

    if (overlappingTicket) return false;

    // 2. Check for temporary slot reservation (concurrency protection)
    const slot = await client.parkingSlot.findUnique({
        where: { id: slotId },
        select: { status: true, reservation_expiry: true }
    });

    if (slot && slot.status === 'RESERVED' && slot.reservation_expiry > new Date()) {
        const resExpiry = new Date(slot.reservation_expiry);
        if (startTime < resExpiry) return false;
    }

    return true;
};

/**
 * Reserve a slot for a specific duration (default 5 mins)
 * Handles race conditions by using atomic updateMany with state check
 */
const reserveSlot = async (facilityId, vehicleType, floorId = null, userId, startTime = new Date(), endTime = null) => {
    const RESERVATION_MINUTES = parseInt(process.env.RESERVATION_TIMEOUT_MINUTES) || 5;
    const expiryTime = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

    // Default endTime to +2 hours if not provided
    if (!endTime) {
        endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
    }

    // A. Find Candidates
    const whereClause = {
        floor: { facility_id: facilityId },
        vehicle_type: vehicleType,
    };
    if (floorId) whereClause.floor_id = floorId;

    // Cleanup old reservations first
    await prisma.parkingSlot.updateMany({
        where: {
            status: 'RESERVED',
            reservation_expiry: { lt: new Date() }
        },
        data: {
            status: 'FREE',
            reservation_expiry: null
        }
    });

    const candidates = await prisma.parkingSlot.findMany({
        where: whereClause,
        take: 10,
        select: { id: true, status: true }
    });

    if (candidates.length === 0) {
        throw new AppError('No suitable slots found', 404);
    }

    // B. Filter by availability and try to reserve
    for (const candidate of candidates) {
        const available = await isSlotAvailable(candidate.id, startTime, endTime);
        if (!available) continue;

        const result = await prisma.parkingSlot.updateMany({
            where: {
                id: candidate.id,
                status: candidate.status // Ensure status hasn't changed since our read
            },
            data: {
                status: 'RESERVED',
                reservation_expiry: expiryTime
            }
        });

        if (result.count > 0) {
            const response = {
                slot_id: candidate.id,
                reserved_until: expiryTime,
                vehicle_type: vehicleType
            };

            emitSlotUpdate(facilityId, {
                slot_id: candidate.id,
                status: 'RESERVED',
                reservation_expiry: expiryTime
            });

            return response;
        }
    }

    throw new AppError('No available slots for the requested window', 409);
};

const confirmBooking = async (slotId, userId, vehicleNumber, vehicleType) => {
    let ticket, facilityId, providerId;

    await prisma.$transaction(async (tx) => {
        const slot = await tx.parkingSlot.findUnique({
            where: { id: slotId },
            include: { floor: true }
        });

        if (!slot) throw new AppError('Slot not found', 404);

        if (slot.status === 'OCCUPIED') {
            throw new AppError('Slot is already occupied', 400);
        }

        if (slot.status === 'RESERVED' && slot.reservation_expiry && new Date() > slot.reservation_expiry) {
            throw new AppError('Reservation expired', 400);
        }

        // Create Ticket
        ticket = await tx.ticket.create({
            data: {
                customer_id: userId,
                slot_id: slotId,
                facility_id: slot.floor.facility_id,
                vehicle_number: vehicleNumber,
                vehicle_type: vehicleType,
                status: 'ACTIVE',
                entry_time: new Date(),
            }
        });

        // Update Slot
        await tx.parkingSlot.update({
            where: { id: slotId },
            data: {
                status: 'OCCUPIED',
                reservation_expiry: null
            }
        });

        facilityId = slot.floor.facility_id;

        const facility = await tx.parkingFacility.findUnique({
            where: { id: facilityId },
            select: { provider_id: true }
        });
        providerId = facility?.provider_id;
    });

    // Notify clients AFTER transaction
    if (facilityId) {
        emitSlotUpdate(facilityId, {
            slot_id: slotId,
            status: 'OCCUPIED'
        });
    }

    if (providerId) {
        emitToProvider(providerId, 'booking_updated', ticket);
    }

    return ticket;
};

const createPendingBooking = async (slotId, userId, vehicleNumber, vehicleType) => {
    return await prisma.$transaction(async (tx) => {
        const slot = await tx.parkingSlot.findUnique({
            where: { id: slotId },
            include: { floor: true }
        });

        if (!slot) throw new AppError('Slot not found', 404);
        if (slot.status === 'OCCUPIED') throw new AppError('Slot is already occupied', 400);

        // Create Ticket in PENDING status
        const ticket = await tx.ticket.create({
            data: {
                customer_id: userId,
                slot_id: slotId,
                facility_id: slot.floor.facility_id,
                vehicle_number: vehicleNumber,
                vehicle_type: vehicleType,
                status: 'PENDING_PAYMENT',
                payment_status: 'PENDING',
                entry_time: new Date(),
            }
        });

        const paymentWindow = 10;
        const expiry = new Date(Date.now() + paymentWindow * 60 * 1000);

        await tx.parkingSlot.update({
            where: { id: slotId },
            data: {
                status: 'RESERVED',
                reservation_expiry: expiry
            }
        });

        return ticket;
    });
};



const createOfflineBooking = async (slotId, vehicleNumber, vehicleType, providerId) => {
    let ticket, facilityId;

    await prisma.$transaction(async (tx) => {
        const slot = await tx.parkingSlot.findUnique({
            where: { id: slotId },
            include: { floor: true }
        });

        if (!slot) throw new AppError('Slot not found', 404);
        
        const start = new Date();
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

        const available = await isSlotAvailable(slotId, start, end, tx);
        if (!available) throw new AppError('Slot is already occupied or reserved for this time', 400);

        ticket = await tx.ticket.create({
            data: {
                customer_id: providerId,
                slot_id: slotId,
                facility_id: slot.floor.facility_id,
                vehicle_number: vehicleNumber,
                vehicle_type: vehicleType,
                status: 'ACTIVE',
                booking_type: 'OFFLINE',
                entry_time: start,
            }
        });

        await tx.parkingSlot.update({
            where: { id: slotId },
            data: { status: 'OCCUPIED' }
        });

        facilityId = slot.floor.facility_id;
    });

    if (facilityId) {
        emitSlotUpdate(facilityId, {
            slot_id: slotId,
            status: 'OCCUPIED'
        });
    }

    return ticket;
};

/**
 * Get all booked time windows for a slot on a given date.
 * Returns an array of { start, end, status } objects.
 */
const getSlotAvailabilityForDay = async (slotId, date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const bookedWindows = await prisma.ticket.findMany({
        where: {
            slot_id: slotId,
            status: { in: ['ACTIVE', 'PENDING_PAYMENT', 'RESERVED'] },
            entry_time: { lte: dayEnd },
            OR: [
                { exit_time: { gte: dayStart } },
                { exit_time: null } // Still active, no exit_time set
            ]
        },
        select: {
            id: true,
            entry_time: true,
            exit_time: true,
            status: true,
            vehicle_type: true
        },
        orderBy: { entry_time: 'asc' }
    });

    return bookedWindows.map(t => ({
        id: t.id,
        start: t.entry_time,
        end: t.exit_time || new Date(new Date(t.entry_time).getTime() + 24 * 60 * 60 * 1000),
        status: t.status,
        vehicle_type: t.vehicle_type
    }));
};

module.exports = {
    reserveSlot,
    confirmBooking,
    createPendingBooking,
    isSlotAvailable,
    createOfflineBooking,
    getSlotAvailabilityForDay
};
