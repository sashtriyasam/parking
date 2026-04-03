const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const { emitSlotUpdate, emitToProvider } = require('./socket.service');

/**
 * Reserve a slot for a specific duration (default 5 mins)
 * Handles race conditions by using atomic updateMany with state check
 */
const reserveSlot = async (facilityId, vehicleType, floorId = null, userId, startTime = new Date(), endTime = null) => {
    // 1. Find potential candidate slot
    // We prioritize a specific floor if provided, otherwise any floor in facility
    const RESERVATION_MINUTES = parseInt(process.env.RESERVATION_TIMEOUT_MINUTES) || 5;
    const reservationExpiry = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

    // Default endTime to +1 hour if not provided
    if (!endTime) {
        endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    }

    // We can't do a simple FIND one because of concurrency.
    // We should try to UPDATE one directly.

    // Strategy: Find a list of free slots IDs, then try to update FIRST available.
    // Or better: Prisma doesn't support "UPDATE ... LIMIT 1" easily in all DBs.
    // We'll use a transaction with a read-then-write approach but checking status in write.

    // A. Find Candidates
    const whereClause = {
        floor: { facility_id: facilityId },
        vehicle_type: vehicleType,
        status: 'FREE',
    };
    if (floorId) whereClause.floor_id = floorId;

    // Cleanup old reservations first (lazy cleanup on write)
    // Ideally this is done by cron, but doing it here helps availability
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
        take: 5, // Just get a few
        select: { id: true }
    });

    if (candidates.length === 0) {
        throw new AppError('No available slots found', 404);
    }

    // B. Try to reserve one
    for (const candidate of candidates) {
        const result = await prisma.parkingSlot.updateMany({
            where: {
                id: candidate.id,
                status: 'FREE' // Optimistic locking check
            },
            data: {
                status: 'RESERVED',
                reservation_expiry: expiryTime
            }
        });

        if (result.count > 0) {
            // Success!
            const response = {
                slot_id: candidate.id,
                reserved_until: expiryTime,
                vehicle_type: vehicleType
            };

            // Notify clients
            emitSlotUpdate(facilityId, {
                slot_id: candidate.id,
                status: 'RESERVED',
                reservation_expiry: expiryTime
            });

            return response;
        }
    }

    throw new AppError('High contention: Could not secure a slot. Please try again.', 409);
};

const confirmBooking = async (slotId, userId, vehicleNumber, vehicleType) => {
    // Verify slot is RESERVED (or FREE) and available for this operation
    // Strictly speaking, we should pass a reservation ID or token, but here we trust the slot state + 5 min window

    return await prisma.$transaction(async (tx) => {
        const slot = await tx.parkingSlot.findUnique({
            where: { id: slotId },
            include: { floor: true }
        });

        if (!slot) throw new AppError('Slot not found', 404);

        // Allow booking if it's FREE or RESERVED (if reserved, strictly should check ownership if we tracked it, 
        // but assuming immediate flow here).
        if (slot.status === 'OCCUPIED') {
            throw new AppError('Slot is already occupied', 400);
        }

        if (slot.status === 'RESERVED') {
            if (slot.reservation_expiry && new Date() > slot.reservation_expiry) {
                throw new AppError('Reservation expired', 400);
            }
            // In a real app, we'd check if the User requesting confirmation matches the Reserver
        }

        // Create Ticket
        const ticket = await tx.ticket.create({
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
        const updatedSlot = await tx.parkingSlot.update({
            where: { id: slotId },
            data: {
                status: 'OCCUPIED',
                reservation_expiry: null
            },
            include: {
                floor: true
            }
        });

        // Notify clients
        emitSlotUpdate(updatedSlot.floor.facility_id, {
            slot_id: slotId,
            status: 'OCCUPIED'
        });

        // Notify provider for real-time dashboard update
        const facility = await tx.parkingFacility.findUnique({
            where: { id: slot.floor.facility_id },
            select: { provider_id: true }
        });
        if (facility) {
            emitToProvider(facility.provider_id, 'booking_updated', ticket);
        }

        return ticket;
    });
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

        // Slot remains RESERVED (or becomes RESERVED if it was FREE)
        // We set a slightly longer reservation for the payment window (e.g., 10 mins)
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

/**
 * Check if a slot is available for a specific time window
 */
const isSlotAvailable = async (slotId, startTime, endTime) => {
    // 1. Check for overlapping tickets
    const overlappingTicket = await prisma.ticket.findFirst({
        where: {
            slot_id: slotId,
            status: { in: ['ACTIVE', 'PENDING_PAYMENT', 'RESERVED'] },
            OR: [
                {
                    // New booking starts during existing booking
                    entry_time: { lte: startTime },
                    exit_time: { gt: startTime }
                },
                {
                    // New booking ends during existing booking
                    entry_time: { lt: endTime },
                    exit_time: { gte: endTime }
                },
                {
                    // New booking completely wraps existing booking
                    entry_time: { gte: startTime },
                    exit_time: { lte: endTime }
                }
            ]
        }
    });

    if (overlappingTicket) return false;

    // 2. Check for temporary slot reservation (concurrency protection)
    const slot = await prisma.parkingSlot.findUnique({
        where: { id: slotId },
        select: { status: true, reservation_expiry: true }
    });

    if (slot && slot.status === 'RESERVED' && slot.reservation_expiry > new Date()) {
        // If it's strictly RESERVED now, we consider it unavailable for an immediate start
        // but it might be available for a future window.
        // For simplicity in v1.9, if the window overlaps with the 5-min reservation, we block.
        const resExpiry = new Date(slot.reservation_expiry);
        if (startTime < resExpiry) return false;
    }

    return true;
};

const createOfflineBooking = async (slotId, vehicleNumber, vehicleType, providerId) => {
    return await prisma.$transaction(async (tx) => {
        const slot = await tx.parkingSlot.findUnique({
            where: { id: slotId },
            include: { floor: true }
        });

        if (!slot) throw new AppError('Slot not found', 404);
        
        // Manual check-in usually means the car is THERE NOW.
        // We ensure no overlap.
        const start = new Date();
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000); // Default 24h for offline

        const available = await isSlotAvailable(slotId, start, end);
        if (!available) throw new AppError('Slot is already occupied or reserved for this time', 400);

        // Create Ticket
        const ticket = await tx.ticket.create({
            data: {
                customer_id: providerId, // Provider is the surrogate customer for offline
                slot_id: slotId,
                facility_id: slot.floor.facility_id,
                vehicle_number: vehicleNumber,
                vehicle_type: vehicleType,
                status: 'ACTIVE',
                booking_type: 'OFFLINE',
                entry_time: start,
            }
        });

        // Update Slot status for current visibility
        await tx.parkingSlot.update({
            where: { id: slotId },
            data: { status: 'OCCUPIED' }
        });

        emitSlotUpdate(slot.floor.facility_id, {
            slot_id: slotId,
            status: 'OCCUPIED'
        });

        return ticket;
    });
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
