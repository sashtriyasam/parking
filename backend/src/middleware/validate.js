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
        const errorMessage = error.errors.map((err) => err.message).join(', ');
        return next(new AppError(errorMessage, 400));
    }
};

module.exports = validate;
