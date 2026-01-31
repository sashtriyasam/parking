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
    } catch (error) {
        Logger.error('Error in reservation cleanup job', error);
    }
});

module.exports = cleanupReservations;
