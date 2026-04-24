const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const { emitSlotUpdate, emitToProvider } = require('./socket.service');

/**
 * Check if a slot is available for a specific time window
 */
const isSlotAvailable = async (slotId, startTime, endTime, client = prisma) => {
    // 0. Cleanup expired PENDING_PAYMENT tickets for this slot
    // This prevents "ghost" bookings from blocking availability indefinitely
    await client.ticket.updateMany({
        where: {
            slot_id: slotId,
            status: 'PENDING_PAYMENT',
            created_at: { lt: new Date(Date.now() - 15 * 60 * 1000) } // 10 min window + 5 min grace
        },
        data: { status: 'CANCELLED' }
    });

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

    if (!slot) return false;

    if (slot.status === 'RESERVED' && slot.reservation_expiry && slot.reservation_expiry > new Date()) {
        if (startTime < slot.reservation_expiry) return false;
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

    // B. Filter by availability and try to reserve atomatically
    for (const candidate of candidates) {
        const reservedId = await prisma.$transaction(async (tx) => {
            // Re-verify availability within the transaction to prevent race conditions
            const available = await isSlotAvailable(candidate.id, startTime, endTime, tx);
            if (!available) return null;

            const result = await tx.parkingSlot.updateMany({
                where: {
                    id: candidate.id,
                    status: 'FREE' // Only reserve if it's still free
                },
                data: {
                    status: 'RESERVED',
                    reservation_expiry: expiryTime
                }
            });

            return result.count > 0 ? candidate.id : null;
        });

        if (reservedId) {
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

const confirmBooking = async (slotId, userId, vehicleNumber, vehicleType, tx = null) => {
    let ticket, facilityId, providerId;

    const execute = async (client) => {
        const slot = await client.parkingSlot.findUnique({
            where: { id: slotId },
            include: { floor: true }
        });

        if (!slot) throw new AppError('Slot not found', 404);

        if (slot.status === 'OCCUPIED') {
            throw new AppError('Slot is already occupied', 400);
        }

        if (slot.status === 'RESERVED') {
            // Phase 9 Fix: Add a 5-minute grace period to the reservation window
            // to account for network delays during payment verification.
            const gracePeriod = 5 * 60 * 1000;
            const effectiveExpiry = slot.reservation_expiry 
                ? new Date(slot.reservation_expiry.getTime() + gracePeriod) 
                : null;

            if (effectiveExpiry && new Date() > effectiveExpiry) {
                throw new AppError('Reservation expired. Please try booking again.', 400);
            }

            // Ownership check: Find the pending ticket that reserved this slot
            const pendingTicket = await client.ticket.findFirst({
                where: {
                    slot_id: slotId,
                    status: 'PENDING_PAYMENT'
                },
                orderBy: { created_at: 'desc' }
            });

            if (pendingTicket && pendingTicket.customer_id !== userId) {
                throw new AppError('Reservation does not belong to user', 403);
            }

            // If a valid pending ticket exists for this user, reuse it
            if (pendingTicket) {
                ticket = await client.ticket.update({
                    where: { id: pendingTicket.id },
                    data: {
                        status: 'ACTIVE',
                        entry_time: new Date(),
                        vehicle_number: vehicleNumber,
                        vehicle_type: vehicleType
                    }
                });
            }
        }

        // Create new ticket if no existing reservation was found/updated
        if (!ticket) {
            ticket = await client.ticket.create({
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
        }

        // Update Slot
        await client.parkingSlot.update({
            where: { id: slotId },
            data: {
                status: 'OCCUPIED',
                reservation_expiry: null
            }
        });

        facilityId = slot.floor.facility_id;

        const facility = await client.parkingFacility.findUnique({
            where: { id: facilityId },
            select: { provider_id: true }
        });
        providerId = facility?.provider_id;

        return { ticket, facilityId, providerId };
    };

    const result = tx ? await execute(tx) : await prisma.$transaction(execute);
    ticket = result.ticket;
    facilityId = result.facilityId;
    providerId = result.providerId;

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



const createOfflineBooking = async (slotId, vehicleNumber, vehicleType, providerId, customerName = null, customerPhone = null) => {
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
                customer_id: null, // Offline customers don't have an app account
                operator_id: providerId, // Record which provider/staff created this
                slot_id: slotId,
                facility_id: slot.floor.facility_id,
                vehicle_number: vehicleNumber,
                vehicle_type: vehicleType,
                customer_name: customerName,
                customer_phone: customerPhone,
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
