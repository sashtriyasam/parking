require('dotenv').config();
const app = require('./src/app');
const prisma = require('./src/config/db');
const Logger = require('./src/utils/logger');
require('./src/jobs/cleanupReservations'); // Initialize cron jobs

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Check DB connection
        await prisma.$connect();
        Logger.info('Database connected successfully');

        app.listen(PORT, () => {
            Logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });
    } catch (error) {
        Logger.error('Failed to connect to the database', error);
        process.exit(1);
    }
}

startServer();
