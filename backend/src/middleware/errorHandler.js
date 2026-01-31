const AppError = require('../utils/AppError');
const Logger = require('../utils/logger');

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    // Prisma unique constraint error code: P2002
    if (err.code === 'P2002') {
        const fields = err.meta.target.join(', ');
        const message = `Duplicate field value: ${fields}. Please use another value!`;
        return new AppError(message, 400);
    }
    return err;
};

const sendErrorDev = (err, res) => {
    Logger.error(`${err.statusCode} - ${err.message} - ${err.stack}`);
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        // Programming or other unknown error: don't leak details
        Logger.error('ERROR 💥', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!',
        });
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        let error = { ...err };
        error.message = err.message;

        // Prisma specific error handling could be added here
        if (error.code === 'P2002') error = handleDuplicateFieldsDB(error);
        // Add more Prisma Error codes as needed

        sendErrorProd(error, res);
    }
};
