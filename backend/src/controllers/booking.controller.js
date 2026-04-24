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
        where: { 
            customer_id: req.user.id,
            status: { not: 'PENDING_PAYMENT' } // Phase 9 Fix: Exclude ghost bookings from history
        },
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
    const now = new Date();
    const bookingStart = new Date(start_time || entry_time || now);
    
    // Validate start date parsing
    if (isNaN(bookingStart.getTime())) {
        return next(new AppError('Invalid start_time format', 400));
    }

    // DISALLOW PAST BOOKINGS
    if (bookingStart.getTime() < now.getTime() - (5 * 60 * 1000)) { // 5 min grace for clock drift
        return next(new AppError('Booking start time cannot be in the past', 400));
    }

    let bookingEnd;
    if (end_time) {
        bookingEnd = new Date(end_time);
    } else if (duration && isFinite(duration)) {
        bookingEnd = new Date(bookingStart.getTime() + (duration * 60 * 60 * 1000));
    } else {
        bookingEnd = new Date(bookingStart.getTime() + (2 * 60 * 60 * 1000)); // Default 2h
    }

    // Validate end date parsing
    if (isNaN(bookingEnd.getTime())) {
        return next(new AppError('Invalid end_time or duration', 400));
    }

    // Validate time window
    if (bookingEnd.getTime() <= bookingStart.getTime()) {
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
    let pricingRule = slot.floor.facility.pricing_rules.find(
        r => r.vehicle_type === vehicle_type
    );

    // Fallback: If specific rule for vehicle_type doesn't exist, try to find ANY rule or use system default
    if (!pricingRule) {
        console.warn(`[BookingFlow] No pricing rule for ${vehicle_type} at facility ${slot.floor.facility.id}. Using fallback.`);
        pricingRule = slot.floor.facility.pricing_rules[0] || { hourly_rate: 20, daily_max: 200 };
    }

    const hourlyRate = Number(pricingRule.hourly_rate || 20);
    const baseFee = hourlyRate * durationHours;
    const cappedFee = pricingRule.daily_max && baseFee > pricingRule.daily_max
        ? Number(pricingRule.daily_max)
        : baseFee;
    const gst = cappedFee * 0.18;
    const totalFee = Math.round((cappedFee + gst) * 100) / 100;

    // Process payment
    let paymentResult;
    try {
        if (payment_method === 'CARD') {
            if (!payment_details) {
                return next(new AppError('Payment details are required for card payments', 400));
            }
            paymentResult = await paymentService.processCardPayment(payment_details, totalFee);
        } else if (payment_method === 'UPI') {
            if (!payment_details || !payment_details.upiId) {
                return next(new AppError('UPI ID is required for UPI payments', 400));
            }
            paymentResult = await paymentService.processUPIPayment(payment_details.upiId, totalFee);
        } else if (payment_method === 'PAY_AT_EXIT') {
            paymentResult = paymentService.createPayAtExitPayment({ amount: totalFee });
        } else {
            if (!payment_details) {
                return next(new AppError('Payment details are required', 400));
            }
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
    const startsWithin15Min = (bookingStart.getTime() - now.getTime()) <= 15 * 60 * 1000;

    console.log(`[BookingFlow] Initiating transaction for Slot: ${slot_id}, User: ${customer_id}, Start: ${bookingStart.toISOString()}`);

    // Transaction to ensure slot is locked and ticket is created
    let ticket;
    try {
        ticket = await prisma.$transaction(async (tx) => {
            // Double check availability inside transaction
            const overlapping = await tx.ticket.findFirst({
                where: {
                    slot_id: slot_id,
                    status: { in: ['ACTIVE', 'PENDING_PAYMENT', 'RESERVED'] },
                    entry_time: { lt: bookingEnd },
                    exit_time: { gt: bookingStart }
                }
            });

            if (overlapping) {
                console.warn(`[BookingFlow] Overlap detected for Slot ${slot_id} during transaction`);
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
                    payment_id: paymentResult?.paymentId || `TEST_${Date.now()}`,
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
        }, {
            timeout: 10000 // 10s timeout
        });
    } catch (err) {
        console.error('[BookingFlow] Transaction Failed:', err.message);
        return next(err instanceof AppError ? err : new AppError(`Booking transaction failed: ${err.message}`, 500));
    }

    console.log(`[BookingFlow] Ticket Created: ${ticket.id}. Proceeding to Post-Generation.`);

    // Generate QR code and PDF OUTSIDE the transaction to prevent timeouts
    let qrCode = null;
    try {
        qrCode = await generateTicketQRCode({
            ticketId: ticket.id,
            slotId: slot_id,
            vehicleNumber: vehicle_number,
            entryTime: bookingStart.toISOString(),
            exitTime: bookingEnd.toISOString(),
            facilityId: slot.floor.facility.id,
        });

        // Update ticket with QR code asynchronously
        prisma.ticket.update({
            where: { id: ticket.id },
            data: { qr_code: qrCode }
        }).catch(err => console.error('[BookingFlow] QR Save Error:', err));

        // Generate PDF (Optional: can be done on demand, but doing it here for completeness)
        // We don't wait for PDF generation to return the response
        generateTicketPDF(ticket).catch(err => console.error('[BookingFlow] PDF Pre-gen Error:', err));
    } catch (genErr) {
        console.warn('[BookingFlow] QR/PDF generation failed, but booking is secured:', genErr.message);
    }

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
            qr_code: qrCode || ticket.qr_code,
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

    // Find the ticket
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { slot: true, facility: true }
    });

    if (!ticket) {
        return next(new AppError('Ticket not found', 404));
    }

    // Check authorization
    const isOwner = ticket.customer_id === req.user.id;
    const isProvider = req.user.role === 'PROVIDER' && ticket.facility.provider_id === req.user.id;

    if (!isOwner && !isProvider) {
        return next(new AppError('Not authorized to cancel this booking', 403));
    }

    // Check if the ticket is active
    if (ticket.status !== 'ACTIVE') {
        return next(new AppError(`Ticket cannot be cancelled in its current status: ${ticket.status}`, 400));
    }

    // Transaction to update ticket and slot
    let shouldEmitFree = false;
    try {
        await prisma.$transaction(async (tx) => {
            // Update ticket status
            await tx.ticket.update({
                where: { id: ticketId },
                data: { status: 'CANCELLED' }
            });

            // Re-fetch slot and check for overlapping active sessions inside transaction
            if (ticket.slot_id) {
                const currentSlot = await tx.parkingSlot.findUnique({
                    where: { id: ticket.slot_id },
                    select: { id: true, status: true }
                });

                // Verify if any OTHER active ticket is utilizing this slot before freeing it.
                const otherActiveTicket = await tx.ticket.findFirst({
                    where: {
                        slot_id: ticket.slot_id,
                        status: 'ACTIVE',
                        id: { not: ticketId }
                    }
                });

                // Only set to FREE if currently OCCUPIED and no other active tickets remain
                if (currentSlot && currentSlot.status === 'OCCUPIED' && !otherActiveTicket) {
                    await tx.parkingSlot.update({
                        where: { id: ticket.slot_id },
                        data: { status: 'FREE' }
                    });
                    shouldEmitFree = true;
                }
            }
        });

        // Emit socket update AFTER successful commit
        if (shouldEmitFree && ticket.slot_id) {
            emitSlotUpdate(ticket.facility_id, {
                slot_id: ticket.slot_id,
                status: 'FREE',
                facility_id: ticket.facility_id
            });
        }
    } catch (err) {
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
