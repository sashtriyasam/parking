const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const pricingService = require('../services/pricing.service');

// Get all active tickets for the logged-in customer
const getActiveTickets = asyncHandler(async (req, res, next) => {
    const activeTickets = await prisma.ticket.findMany({
        where: {
            customer_id: req.user.id,
            status: 'ACTIVE'
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
            facility: true // Direct relation if exists, or via slot
        },
        orderBy: {
            entry_time: 'desc'
        }
    });

    // Calculate current fee for each active ticket
    const stickersWithFees = await Promise.all(activeTickets.map(async (ticket) => {
        const exitTime = new Date(); // Current time
        const entryTime = new Date(ticket.entry_time);

        let currentFee = 0;
        try {
            // Re-calculate fee based on current duration
            // Note: This relies on pricing service to handle partial hours
            const facilityId = ticket.facility?.id || ticket.slot?.floor?.facility?.id;

            if (facilityId) {
                const pricing = await pricingService.calculateParkingFee(
                    entryTime,
                    exitTime,
                    ticket.vehicle_type,
                    facilityId
                );
                currentFee = pricing.total_fee;
            }
        } catch (err) {
            console.error(`Error calculating fee for ticket ${ticket.id}:`, err);
        }

        return {
            ...ticket,
            current_fee: currentFee
        };
    }));

    res.status(200).json({
        status: 'success',
        results: stickersWithFees.length,
        data: stickersWithFees
    });
});

// Get ticket history (Completed, Cancelled)
const getTicketHistory = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const tickets = await prisma.ticket.findMany({
        where: {
            customer_id: req.user.id,
            status: {
                in: ['COMPLETED', 'CANCELLED']
            }
        },
        include: {
            facility: true,
            slot: {
                include: {
                    floor: true
                }
            }
        },
        orderBy: {
            entry_time: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(skip)
    });

    const total = await prisma.ticket.count({
        where: {
            customer_id: req.user.id,
            status: {
                in: ['COMPLETED', 'CANCELLED']
            }
        }
    });

    res.status(200).json({
        status: 'success',
        results: tickets.length,
        total,
        page: parseInt(page),
        data: tickets
    });
});

// Get single ticket details
const getTicketById = asyncHandler(async (req, res, next) => {
    const { ticketId } = req.params;

    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
            facility: true,
            slot: {
                include: {
                    floor: true
                }
            },
            customer: {
                select: {
                    id: true,
                    full_name: true,
                    email: true
                }
            }
        }
    });

    if (!ticket) {
        return next(new AppError('Ticket not found', 404));
    }

    // Authorization check
    if (req.user.role === 'CUSTOMER' && ticket.customer_id !== req.user.id) {
        return next(new AppError('Not authorized to view this ticket', 403));
    }

    // Calculate live fee if active
    let currentFee = ticket.total_fee;
    if (ticket.status === 'ACTIVE') {
        const exitTime = new Date();
        const entryTime = new Date(ticket.entry_time);
        const facilityId = ticket.facility?.id || ticket.slot?.floor?.facility?.id;

        if (facilityId) {
            const pricing = await pricingService.calculateParkingFee(
                entryTime,
                exitTime,
                ticket.vehicle_type,
                facilityId
            );
            currentFee = pricing.total_fee;
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            ...ticket,
            current_fee: currentFee
        }
    });
});

// Extend parking duration (Stub for now)
const extendTicket = asyncHandler(async (req, res, next) => {
    const { ticketId } = req.params;
    const { additional_hours } = req.body;

    return next(new AppError('Extend parking functionality coming soon', 501));
});

module.exports = {
    getActiveTickets,
    getTicketHistory,
    getTicketById,
    extendTicket
};
