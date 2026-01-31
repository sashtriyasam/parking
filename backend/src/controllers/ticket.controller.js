const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const pricingService = require('../services/pricing.service');

const getActiveTickets = asyncHandler(async (req, res) => {
    const tickets = await prisma.ticket.findMany({
        where: {
            customer_id: req.user.id,
            status: 'ACTIVE'
        },
        include: {
            slot: {
                include: {
                    floor: {
                        include: {
                            facility: {
                                select: { name: true, address: true, city: true }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { entry_time: 'desc' }
    });

    res.status(200).json({ status: 'success', results: tickets.length, data: tickets });
});

const getTicketHistory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
            where: {
                customer_id: req.user.id,
                status: { in: ['COMPLETED', 'CANCELLED'] }
            },
            include: {
                slot: {
                    include: {
                        floor: {
                            include: {
                                facility: {
                                    select: { name: true, address: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { exit_time: 'desc' },
            skip,
            take: parseInt(limit)
        }),
        prisma.ticket.count({
            where: {
                customer_id: req.user.id,
                status: { in: ['COMPLETED', 'CANCELLED'] }
            }
        })
    ]);

    res.status(200).json({
        status: 'success',
        results: tickets.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        data: tickets
    });
});

const getTicketById = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;

    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
            slot: {
                include: {
                    floor: {
                        include: {
                            facility: {
                                select: { name: true, address: true, city: true, operating_hours: true }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!ticket || ticket.customer_id !== req.user.id) {
        throw new AppError('Ticket not found', 404);
    }

    // Generate QR code data (you can use a library like 'qrcode' for actual QR generation)
    const qrData = `TICKET:${ticket.id}`;

    res.status(200).json({
        status: 'success',
        data: {
            ...ticket,
            qr_code_data: qrData
        }
    });
});

const extendTicket = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { additional_hours } = req.body;

    if (!additional_hours || additional_hours < 1) {
        throw new AppError('Additional hours must be at least 1', 400);
    }

    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
            slot: {
                include: {
                    floor: {
                        include: {
                            facility: true
                        }
                    }
                }
            }
        }
    });

    if (!ticket || ticket.customer_id !== req.user.id) {
        throw new AppError('Ticket not found', 404);
    }

    if (ticket.status !== 'ACTIVE') {
        throw new AppError('Only active tickets can be extended', 400);
    }

    // Calculate additional fee
    const facilityId = ticket.slot.floor.facility.id;
    const pricingRule = await prisma.pricingRule.findFirst({
        where: {
            facility_id: facilityId,
            vehicle_type: ticket.vehicle_type
        }
    });

    if (!pricingRule) {
        throw new AppError('Pricing not found', 404);
    }

    const additionalFee = parseFloat(pricingRule.hourly_rate) * additional_hours;
    const newTotalFee = parseFloat(ticket.total_fee || 0) + additionalFee;

    // Update ticket (in real app, process payment first)
    const updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
            total_fee: newTotalFee
        }
    });

    res.status(200).json({
        status: 'success',
        message: `Ticket extended by ${additional_hours} hour(s)`,
        data: {
            additional_fee: additionalFee,
            new_total_fee: newTotalFee,
            ticket: updatedTicket
        }
    });
});

module.exports = {
    getActiveTickets,
    getTicketHistory,
    getTicketById,
    extendTicket
};
