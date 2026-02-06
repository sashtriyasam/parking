const AppError = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        // Safely handle Zod errors and other error types
        const errorMessage = error.errors
            ? error.errors.map((err) => err.message).join(', ')
            : error.message || 'Validation failed';
        return next(new AppError(errorMessage, 400));
    }
};

module.exports = validate;
