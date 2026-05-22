require('dotenv').config();
const app = require('./src/app');
const prisma = require('./src/config/db');
const Logger = require('./src/utils/logger');
require('./src/jobs/cleanupReservations'); // Initialize cron jobs

const http = require('http');
const { initSocket } = require('./src/services/socket.service');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Phase 12: Environment Validation
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    Logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

// Optional env var warnings
const optionalEnvVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'EXPO_ACCESS_TOKEN'];
optionalEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
        Logger.warn(`Optional environment variable ${envVar} is missing. Some features may not work.`);
    }
});

async function startServer() {
    try {
        // Check DB connection
        await prisma.$connect();
        Logger.info('Database connected successfully');

        // Initialize Socket.io with shared CORS origins
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            process.env.FRONTEND_URL,
            process.env.MOBILE_APP_URL,
            process.env.RENDER_APP_URL,
            'https://parkeasy-frontend.onrender.com',
        ].filter(Boolean);
        initSocket(server, allowedOrigins);
        Logger.info('Socket.io initialized with CORS origins');

        server.listen(PORT, () => {
            Logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
            Logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        Logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Phase 12: Graceful Shutdown
const gracefulShutdown = async (signal) => {
    Logger.info(`${signal} received. Starting graceful shutdown...`);
    
    server.close(async () => {
        Logger.info('HTTP server closed.');
        
        try {
            await prisma.$disconnect();
            Logger.info('Prisma disconnected.');
            process.exit(0);
        } catch (error) {
            Logger.error('Error during Prisma disconnect:', error);
            process.exit(1);
        }
    });

    // If shutdown takes too long (timeout)
    setTimeout(() => {
        Logger.error('Graceful shutdown timed out. Forcefully exiting.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
    Logger.error('Uncaught Exception:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    Logger.error('Unhandled Rejection:', reason);
    gracefulShutdown('unhandledRejection').catch(() => process.exit(1));
});

startServer();
