const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        full_name: z.string().min(2, 'Name must be at least 2 characters'),
        phone_number: z.string().optional(),
        role: z.enum(['CUSTOMER', 'PROVIDER']).default('CUSTOMER'),
    }),
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
});

module.exports = {
    registerSchema,
    loginSchema,
};
