const cron = require('node-cron');
const prisma = require('../config/db');
const Logger = require('../utils/logger');

// Run every minute
const cleanupReservations = cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        const result = await prisma.parkingSlot.updateMany({
            where: {
                status: 'RESERVED',
                reservation_expiry: { lt: now }
            },
            data: {
                status: 'FREE',
                reservation_expiry: null
            }
        });

        if (result.count > 0) {
            Logger.info(`Cleaned up ${result.count} expired reservations`);
        }

        const cancelledTickets = await prisma.ticket.updateMany({
            where: {
                status: 'PENDING_PAYMENT',
                created_at: { lt: new Date(Date.now() - 15 * 60 * 1000) }
            },
            data: { status: 'CANCELLED' }
        });

        if (cancelledTickets.count > 0) {
            Logger.info(`Cancelled ${cancelledTickets.count} expired PENDING_PAYMENT tickets`);
        }
    } catch (error) {
        Logger.error('Error in reservation cleanup job', error);
    }
});

module.exports = cleanupReservations;
