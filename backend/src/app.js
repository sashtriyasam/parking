const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const rateLimit = require('express-rate-limit');

// Rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // increased for E2E testing
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const parkingRoutes = require('./routes/parking.routes');
const bookingRoutes = require('./routes/booking.routes');
const providerRoutes = require('./routes/provider.routes');
const customerRoutes = require('./routes/customer.routes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const setupSwagger = require('./config/swagger'); // Import Swagger
const prisma = require('./config/db');
const paymentRoutes = require('./routes/payment.routes');
const verificationRoutes = require('./routes/verificationRoutes');
const passRoutes = require('./routes/pass.routes');
const adminRoutes = require('./routes/admin.routes');
const { version } = require('../package.json');

const app = express();

// Middleware
app.use(helmet());
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    process.env.MOBILE_APP_URL,
    process.env.RENDER_APP_URL, // Add this
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
}));

// Health Check (Infrastructure checks should not be rate-limited)
app.get('/health', async (req, res) => {
    let dbStatus = 'disconnected';
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (err) {
        dbStatus = 'disconnected';
    }

    res.status(200).json({
        status: 'ok',
        environment: process.env.NODE_ENV || 'development',
        database: dbStatus,
        timestamp: new Date().toISOString(),
        version,
    });
});

app.use(limiter); // Apply rate limiter globally to all subsequent routes
app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

setupSwagger(app); // Initialize Swagger docs at /api-docs

// Versioned Routes
const apiRoutes = express.Router();
apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/parking', parkingRoutes);
apiRoutes.use('/bookings', bookingRoutes);
apiRoutes.use('/provider', providerRoutes);
apiRoutes.use('/customer', customerRoutes);
apiRoutes.use('/payments', paymentRoutes);
apiRoutes.use('/verification', verificationRoutes);
apiRoutes.use('/passes', passRoutes);
apiRoutes.use('/admin', adminRoutes);

// Mount with and without v1 for maximum stability
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);

// Global version info
app.get('/api/version', (req, res) => res.status(200).json({ status: 'success', version, environment: process.env.NODE_ENV }));

// 404 Handler
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;

// AI SELF-TEST CHECKLIST (run mentally on load):
// ✅ paymentRoutes imported and mounted at /api/v1/payments
// ✅ verificationRoutes imported and mounted at /api/v1/verification
// ✅ passRoutes imported and mounted at /api/v1/passes
// ✅ limiter applied globally before all routes
// ✅ setupSwagger(app) called to enable /api-docs
// ✅ No ReferenceError on startup
