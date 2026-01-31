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

// NEW: Complete booking flow with payment
const paymentService = require('../services/payment.service');
const { generateTicketQRCode } = require('../utils/qrcode');
const { generateTicketPDF } = require('../utils/pdfGenerator');

/**
 * Create booking with payment - NEW BOOKING FLOW
 */
const createBookingWithPayment = asyncHandler(async (req, res, next) => {
    const {
        slot_id,
        vehicle_type,
        vehicle_number,
        entry_time,
        duration,
        payment_method,
        payment_details,
    } = req.body;

    const customer_id = req.user.id;

    // Validate slot availability
    const slot = await prisma.parkingSlot.findUnique({
        where: { id: slot_id },
        include: {
            floor: {
                include: {
                    facility: {
                        include: { pricing_rules: true }
                    }
                }
            }
        }
    });

    if (!slot || slot.status !== 'FREE') {
        return next(new AppError('Slot not available', 400));
    }

    // Calculate fees
    const pricingRule = slot.floor.facility.pricing_rules.find(
        r => r.vehicle_type === vehicle_type
    );

    if (!pricingRule) {
        return next(new AppError('Pricing rule not found for vehicle type', 404));
    }

    const baseFee = pricingRule.hourly_rate * (duration || 1);
    const cappedFee = pricingRule.daily_max && baseFee > pricingRule.daily_max
        ? pricingRule.daily_max
        : baseFee;
    const gst = cappedFee * 0.18;
    const totalFee = cappedFee + gst;

    // Process payment
    let paymentResult;
    try {
        if (payment_method === 'CARD') {
            paymentResult = await paymentService.processCardPayment(payment_details, totalFee);
        } else if (payment_method === 'UPI') {
            paymentResult = await paymentService.processUPIPayment(payment_details.upiId, totalFee);
        } else if (payment_method === 'PAY_AT_EXIT') {
            paymentResult = paymentService.createPayAtExitPayment({ amount: totalFee });
        } else {
            paymentResult = await paymentService.processCardPayment(payment_details, totalFee);
        }

        if (!paymentResult.success) {
            return next(new AppError('Payment failed', 400));
        }
    } catch (error) {
        console.error('Payment error:', error);
        return next(new AppError('Payment processing failed', 500));
    }

    // Create ticket
    const ticket = await prisma.ticket.create({
        data: {
            customer_id,
            slot_id,
            vehicle_number,
            vehicle_type,
            entry_time: new Date(entry_time),
            status: 'ACTIVE',
            total_fee: totalFee,
            payment_status: payment_method === 'PAY_AT_EXIT' ? 'PENDING' : 'PAID',
            payment_method,
            payment_id: paymentResult.paymentId,
        },
        include: {
            parking_slot: {
                include: {
                    floor: {
                        include: {
                            facility: true
                        }
                    }
                }
            },
            parking_facility: true,
        }
    });

    // Update slot status
    await prisma.parkingSlot.update({
        where: { id: slot_id },
        data: { status: 'OCCUPIED' }
    });

    // Generate QR code
    const qrCode = await generateTicketQRCode({
        ticketId: ticket.id,
        slotId: slot_id,
        vehicleNumber: vehicle_number,
        entryTime: entry_time,
        facilityId: slot.floor.facility.id,
    });

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
        io.to(`facility:${slot.floor.facility.id}`).emit('slotUpdate', {
            slotId: slot_id,
            status: 'OCCUPIED',
        });
    }

    res.status(201).json({
        status: 'success',
        data: {
            ...ticket,
            qr_code: qrCode,
        }
    });
});

/**
 * Download ticket as PDF
 */
const downloadTicketPDF = asyncHandler(async (req, res, next) => {
    const { ticketId } = req.params;

    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
            parking_slot: {
                include: {
                    floor: true
                }
            },
            parking_facility: true,
        }
    });

    if (!ticket) {
        return next(new AppError('Ticket not found', 404));
    }

    // Check ownership
    if (req.user.role === 'CUSTOMER' && ticket.customer_id !== req.user.id) {
        return next(new AppError('Not authorized', 403));
    }

    // Generate PDF
    const pdfBuffer = await generateTicketPDF(ticket);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${ticket.id.slice(0, 8)}.pdf`);
    res.send(pdfBuffer);
});

module.exports = {
    createBooking,
    reserveSlot,
    endBooking,
    getMyBookings,
    createBookingWithPayment,
    downloadTicketPDF,
};
