const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const bookingService = require('../services/booking.service');
const pricingService = require('../services/pricing.service');
const { emitSlotUpdate } = require('../services/socket.service');



const reserveSlot = asyncHandler(async (req, res) => {
    const { facility_id, vehicle_type, floor_id } = req.body;
    const result = await bookingService.reserveSlot(facility_id, vehicle_type, floor_id, req.user.id);
    res.status(200).json({ status: 'success', data: result });
});

const createBooking = asyncHandler(async (req, res, next) => {
    const { slot_id, vehicle_number, vehicle_type, status } = req.body;

    let ticket;
    if (status === 'PENDING') {
        ticket = await bookingService.createPendingBooking(slot_id, req.user.id, vehicle_number, vehicle_type);
    } else {
        ticket = await bookingService.confirmBooking(slot_id, req.user.id, vehicle_number, vehicle_type);
    }

    const { sendPushNotification } = require('../utils/pushNotifications');
    
    // Send push notification if user has a token
    if (req.user.push_token) {
        sendPushNotification(
            req.user.push_token,
            'Booking Confirmed!',
            `Your spot ${ticket.slot.slot_number} is ready at ${ticket.facility.name}.`,
            { ticketId: ticket.id, facilityId: ticket.facility_id }
        ).catch(err => console.error('Notification Error:', err));
    }

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

    // Check ownership
    if (req.user.role === 'CUSTOMER') {
        if (ticket.customer_id !== req.user.id) {
            return next(new AppError('Not authorized to end this booking', 403));
        }
    } else if (req.user.role === 'PROVIDER') {
        if (ticket.slot.floor.facility.provider_id !== req.user.id) {
            return next(new AppError('You do not have permission to manage this facility', 403));
        }
    } else {
        return next(new AppError('Invalid user role', 403));
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
    const result = await prisma.$transaction(async (tx) => {
        const updatedTicket = await tx.ticket.update({
            where: { id: ticket_id },
            data: {
                exit_time,
                total_fee,
                status: 'COMPLETED',
            },
        });

        await tx.parkingSlot.update({
            where: { id: ticket.slot_id },
            data: { status: 'FREE' },
        });

        return updatedTicket;
    });

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
        io.to(`facility_${ticket.slot.floor.facility.id}`).emit('slot_updated', {
            slot_id: ticket.slot_id,
            status: 'FREE',
            facility_id: ticket.slot.floor.facility.id
        });
    }

    // Phase 9B: Push Notification for Checkout
    const { sendPushNotification } = require('../utils/pushNotifications');
    if (req.user.push_token) {
        sendPushNotification(
            req.user.push_token,
            '✅ Checkout Complete',
            `Total charge: ₹${total_fee}. Thanks for using ParkEasy!`,
            { 
                type: 'booking_completed', 
                ticketId: ticket_id, 
                amount: total_fee 
            }
        ).catch(err => console.error('Notification Error:', err));
    }

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
        start_time,
        end_time,
        entry_time, // legacy fallback
        duration,    // legacy fallback
        payment_method,
        payment_details,
    } = req.body;

    const customer_id = req.user.id;

    // Resolve start/end times (support both new and legacy formats)
    const bookingStart = new Date(start_time || entry_time || Date.now());
    let bookingEnd;
    if (end_time) {
        bookingEnd = new Date(end_time);
    } else if (duration) {
        bookingEnd = new Date(bookingStart.getTime() + (duration * 60 * 60 * 1000));
    } else {
        bookingEnd = new Date(bookingStart.getTime() + (2 * 60 * 60 * 1000)); // Default 2h
    }

    // Validate time window
    if (bookingEnd <= bookingStart) {
        return next(new AppError('End time must be after start time', 400));
    }

    const durationMs = bookingEnd - bookingStart;
    const durationHours = durationMs / (1000 * 60 * 60);

    if (durationHours < 0.5) {
        return next(new AppError('Minimum booking duration is 30 minutes', 400));
    }
    if (durationHours > 24) {
        return next(new AppError('Maximum booking duration is 24 hours', 400));
    }

    // Validate slot exists
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

    if (!slot) {
        return next(new AppError('Slot not found', 404));
    }

    // Check time-based availability (allows same slot at different times)
    const available = await bookingService.isSlotAvailable(slot_id, bookingStart, bookingEnd);
    if (!available) {
        return next(new AppError('This slot is already booked for the selected time window. Please choose a different time or slot.', 409));
    }

    // Calculate fees
    const pricingRule = slot.floor.facility.pricing_rules.find(
        r => r.vehicle_type === vehicle_type
    );

    if (!pricingRule) {
        return next(new AppError('Pricing rule not found for vehicle type', 404));
    }

    const baseFee = pricingRule.hourly_rate * durationHours;
    const cappedFee = pricingRule.daily_max && baseFee > pricingRule.daily_max
        ? pricingRule.daily_max
        : baseFee;
    const gst = cappedFee * 0.18;
    const totalFee = Math.round((cappedFee + gst) * 100) / 100;

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

    // Determine if slot should be marked OCCUPIED now
    // Only mark OCCUPIED if booking starts within 15 minutes
    const now = new Date();
    const startsWithin15Min = (bookingStart.getTime() - now.getTime()) <= 15 * 60 * 1000;

    // Transaction to ensure slot is locked and ticket is created
    const ticket = await prisma.$transaction(async (tx) => {
        // Double check availability inside transaction
        const overlapping = await tx.ticket.findFirst({
            where: {
                slot_id: slot_id,
                status: { in: ['ACTIVE', 'PENDING_PAYMENT'] },
                entry_time: { lt: bookingEnd },
                exit_time: { gt: bookingStart }
            }
        });

        if (overlapping) {
            throw new AppError('Slot is no longer available for this time window', 409);
        }

        // Update slot status only if booking starts now
        if (startsWithin15Min) {
            await tx.parkingSlot.update({
                where: { id: slot_id },
                data: { status: 'OCCUPIED' }
            });
        }

        // Create ticket with both entry_time and exit_time (scheduled window)
        return await tx.ticket.create({
            data: {
                customer_id,
                facility_id: slot.floor.facility.id,
                slot_id,
                vehicle_number,
                vehicle_type,
                entry_time: bookingStart,
                exit_time: bookingEnd,
                status: 'ACTIVE',
                total_fee: totalFee,
                payment_status: payment_method === 'PAY_AT_EXIT' ? 'PENDING' : 'PAID',
                payment_method,
                payment_id: paymentResult.paymentId,
            },
            include: {
                slot: {
                    include: {
                        floor: {
                            include: {
                                facility: true
                            }
                        }
                    }
                },
                facility: true,
            }
        });
    });

    // Generate QR code
    const qrCode = await generateTicketQRCode({
        ticketId: ticket.id,
        slotId: slot_id,
        vehicleNumber: vehicle_number,
        entryTime: bookingStart.toISOString(),
        exitTime: bookingEnd.toISOString(),
        facilityId: slot.floor.facility.id,
    });

    // Update ticket with QR code
    await prisma.ticket.update({
        where: { id: ticket.id },
        data: { qr_code: qrCode }
    });

    // Emit socket event for real-time update
    if (startsWithin15Min) {
        emitSlotUpdate(slot.floor.facility.id, {
            slot_id: slot_id,
            status: 'OCCUPIED',
            facility_id: slot.floor.facility.id
        });
    }

    res.status(201).json({
        status: 'success',
        data: {
            ...ticket,
            qr_code: qrCode,
            duration_hours: Math.round(durationHours * 100) / 100,
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
            slot: {
                include: {
                    floor: true
                }
            },
            facility: true,
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

    // Set explicit headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="parkeasy-ticket-${ticket.id.slice(0, 8)}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(200).send(pdfBuffer);
});

/**
 * Cancel a booking
 */
const cancelBooking = asyncHandler(async (req, res, next) => {
    const { ticketId } = req.params;
    const customer_id = req.user.id;

    console.log(`[DEBUG] Attempting to cancel ticket: ${ticketId} for customer: ${customer_id}`);

    // Find the ticket
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { slot: true, facility: true }
    });

    if (!ticket) {
        console.log(`[DEBUG] Ticket ${ticketId} not found`);
        return next(new AppError('Ticket not found', 404));
    }

    // Check authorization
    const isOwner = ticket.customer_id === req.user.id;
    const isProvider = req.user.role === 'PROVIDER' && ticket.facility.provider_id === req.user.id;

    if (!isOwner && !isProvider) {
        console.log(`[DEBUG] Unauthorized attempt to cancel ticket ${ticketId}. Role: ${req.user.role}, Requester: ${req.user.id}`);
        return next(new AppError('Not authorized to cancel this booking', 403));
    }

    // Check if the ticket is active
    if (ticket.status !== 'ACTIVE') {
        console.log(`[DEBUG] Cannot cancel ticket ${ticketId}. Current status: ${ticket.status}`);
        return next(new AppError(`Ticket cannot be cancelled in its current status: ${ticket.status}`, 400));
    }

    console.log(`[DEBUG] Ticket ${ticketId} is valid for cancellation. Starting transaction...`);

    // Transaction to update ticket and slot
    try {
        console.log(`[DEBUG] Starting transaction for ticket ${ticketId}...`);
        await prisma.$transaction(async (tx) => {
            // Update ticket status
            const updatedTicket = await tx.ticket.update({
                where: { id: ticketId },
                data: { status: 'CANCELLED' }
            });
            console.log(`[DEBUG] Ticket status updated to CANCELLED in transaction`);

            // If the slot is currently OCCUPIED by this ticket, free it.
            if (ticket.slot && ticket.slot.status === 'OCCUPIED' && ticket.slot_id) {
                console.log(`[DEBUG] Releasing slot ${ticket.slot_id} as it was OCCUPIED`);
                await tx.parkingSlot.update({
                    where: { id: ticket.slot_id },
                    data: { status: 'FREE' }
                });

                // Emit socket update
                emitSlotUpdate(ticket.facility_id, {
                    slot_id: ticket.slot_id,
                    status: 'FREE',
                    facility_id: ticket.facility_id
                });
            } else {
                console.log(`[DEBUG] No slot to release or slot not OCCUPIED. (Slot exists: ${!!ticket.slot})`);
            }
        });
        console.log(`[DEBUG] Transaction committed successfully for ticket ${ticketId}`);
    } catch (err) {
        console.error(`[DEBUG] Transaction failed for ticket ${ticketId}:`, err);
        return next(new AppError(`Failed to cancel booking: ${err.message}`, 500));
    }

    res.status(200).json({
        status: 'success',
        message: 'Booking cancelled successfully'
    });
});

module.exports = {
    createBooking,
    reserveSlot,
    endBooking,
    getMyBookings,
    createBookingWithPayment,
    downloadTicketPDF,
    cancelBooking
};
