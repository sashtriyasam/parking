const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const bookingService = require('../services/booking.service');
const pricingService = require('../services/pricing.service');

// Calculate fee helper (Simplistic version)
const calculateFee = (entryTime, exitTime, hourlyRate) => {
    const durationMs = exitTime - entryTime;
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
    return durationHours * hourlyRate;
};

const reserveSlot = asyncHandler(async (req, res) => {
    const { facility_id, vehicle_type, floor_id } = req.body;
    const result = await bookingService.reserveSlot(facility_id, vehicle_type, floor_id, req.user.id);
    res.status(200).json({ status: 'success', data: result });
});

const createBooking = asyncHandler(async (req, res, next) => {
    const { slot_id, vehicle_number, vehicle_type } = req.body;
    const customer_id = req.user.id;

    // Assuming the user has already "reserved" or we do a direct book.
    // If direct book, we might skip reservation or do it internally.
    // For this flow: Confirm Booking.

    const ticket = await bookingService.confirmBooking(slot_id, req.user.id, vehicle_number, vehicle_type);

    res.status(201).json({ status: 'success', data: ticket });
});

const endBooking = asyncHandler(async (req, res, next) => {
    const { ticket_id } = req.body;

    const ticket = await prisma.ticket.findUnique({
        where: { id: ticket_id },
        include: { slot: { include: { floor: { include: { facility: { include: { pricing_rules: true } } } } } } }
    });

    if (!ticket || ticket.status !== 'ACTIVE') {
        return next(new AppError('Active ticket not found', 404));
    }

    // Check ownership (either customer or provider of the facility)
    // For simplicity allowing customer to check out themselves or provider
    if (req.user.role === 'CUSTOMER' && ticket.customer_id !== req.user.id) {
        return next(new AppError('Not authorized', 403));
    }

    const exit_time = req.body.actual_exit_time ? new Date(req.body.actual_exit_time) : new Date();
    const entry_time = new Date(ticket.entry_time);

    // Calculate Fee using Service
    const pricingResult = await pricingService.calculateParkingFee(
        entry_time,
        exit_time,
        ticket.vehicle_type,
        ticket.slot.floor.facility.id
    );

    const total_fee = pricingResult.total_fee;

    // Transaction
    const result = await prisma.$transaction(async (prisma) => {
        const updatedTicket = await prisma.ticket.update({
            where: { id: ticket_id },
            data: {
                exit_time,
                total_fee,
                status: 'COMPLETED',
            },
        });

        await prisma.parkingSlot.update({
            where: { id: ticket.slot_id },
            data: { status: 'FREE' },
        });

        return updatedTicket;
    });

    res.status(200).json({ status: 'success', data: result });
});

const getMyBookings = asyncHandler(async (req, res) => {
    const bookings = await prisma.ticket.findMany({
        where: { customer_id: req.user.id },
        orderBy: { entry_time: 'desc' },
        include: { slot: { include: { floor: { include: { facility: true } } } } }
    });
    res.status(200).json({ status: 'success', results: bookings.length, data: bookings });
});

module.exports = {
    createBooking,
    reserveSlot,
    endBooking,
    getMyBookings
};
