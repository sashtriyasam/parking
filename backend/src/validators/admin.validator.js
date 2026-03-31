const { z } = require('zod');
const { VALID_ROLES } = require('../constants/roles');

const roleUpdateSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
  body: z.object({
    role: z.enum(VALID_ROLES, {
      errorMap: () => ({ message: `Please provide a valid role (${VALID_ROLES.join(', ')})` }),
    }),
  }),
});

const processWithdrawalSchema = z.object({
  params: z.object({
    withdrawalId: z.string().uuid('Invalid withdrawal ID format'),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED'], {
      required_error: 'Status is required (APPROVED or REJECTED)',
    }),
    remarks: z.string().max(200, 'Remarks cannot exceed 200 characters').optional(),
  }),
});

module.exports = {
  roleUpdateSchema,
  processWithdrawalSchema,
};
