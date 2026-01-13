import Joi from 'joi';
import { UserRole } from '../../generated/prisma/client';


export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().optional()

});
export const TokenValidationSchema = Joi.object({
  email: Joi.string().email().required(),
  token: Joi.string().required(),
});
export const userVerifySchema = Joi.object({
  email: Joi.string().email().required(),
  token: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().pattern(/^\d+$/).required()
  ).required().custom((value) => {
    // Convert string to number if needed
    return typeof value === 'string' ? parseInt(value, 10) : value;
  }),
});


export const forgotSchema = Joi.object({
  email: Joi.string().email().required(),
  token: Joi.string().required(),
  newPassword: Joi.string().optional()
});
export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().optional(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phone: Joi.string().optional(),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional(),
  isActive: Joi.boolean().optional(),
});


export const updateProfileSchema = Joi.object({
    avatar: Joi.string().optional(),
    businessName: Joi.string().optional(),
    taxId: Joi.string().optional(),
    isVerified: Joi.boolean().optional(),
});  