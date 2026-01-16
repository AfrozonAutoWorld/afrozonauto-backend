import Joi from 'joi';
import { UserRole } from '../../generated/prisma/client';
import { fileInfoSchema } from './files.validation';


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
  token: Joi.string().required(),
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

  uploadedFiles: Joi.array()
    .items(fileInfoSchema)
    .optional(),

  avatar: Joi.string()
    .uri()
    .optional(),

  // =========================
  // Personal Information
  // =========================
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional(),

  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional(),

  dateOfBirth: Joi.date()
    .less('now')
    .optional(),

  // =========================
  // KYC / Identification
  // =========================
  identificationNumber: Joi.string()
    .trim()
    .min(5)
    .max(50)
    .optional(),

  identificationType: Joi.string()
    .valid(
      'passport',
      'national_id',
      'drivers_license',
      'voters_card'
    )
    .optional(),

  identificationDocument: Joi.string()
    .uri()
    .optional(),

  // =========================
  // Business Information
  // =========================
  businessName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  taxId: Joi.string()
    .trim()
    .min(5)
    .max(50)
    .optional(),
})
  .min(1)          // Must update at least one field
  .unknown(false); // Reject unknown fields
