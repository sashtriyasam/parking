const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const { emitSlotUpdate } = require('./socket.service');

/**
 * Reserve a slot for a specific duration (default 5 mins)
 * Handles race conditions by using atomic updateMany with state check
 */
const reserveSlot = async (facilityId, vehicleType, floorId = null, userId) => {
    // 1. Find potential candidate slot
    // We prioritize a specific floor if provided, otherwise any floor in facility
    const RESERVATION_MINUTES = parseInt(process.env.RESERVATION_TIMEOUT_MINUTES) || 5;
    const expiryTime = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

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
                slotId: candidate.id,
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
            slotId: slotId,
            status: 'OCCUPIED'
        });

        return ticket;
    });
};

module.exports = {
    reserveSlot,
    confirmBooking
};
