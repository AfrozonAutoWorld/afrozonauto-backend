import Joi from 'joi';
import { UserRole } from '../../generated/prisma/client';



export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),

  password: Joi.string().optional(),
  fullName: Joi.string().optional(),
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
  