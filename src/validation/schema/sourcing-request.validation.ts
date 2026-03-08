import Joi from 'joi';
import type { CreateSourcingRequestDto } from '../interfaces/ISourcingRequest';

const conditionSchema = Joi.string().valid('used', 'new', 'either').required();
const shippingSchema = Joi.string().valid('roro', 'container').required();

export const createSourcingRequestSchema = Joi.object<CreateSourcingRequestDto>({
  // Step 1
  make: Joi.string().trim().min(1).max(100).required(),
  model: Joi.string().trim().min(1).max(120).required(),
  yearFrom: Joi.string().allow('').optional(),
  yearTo: Joi.string().allow('').optional(),
  trim: Joi.string().trim().max(120).allow('').optional(),
  condition: conditionSchema,

  // Step 2
  budgetUsd: Joi.string().trim().max(20).required(),
  exteriorColor: Joi.string().trim().max(50).required(),
  anyColor: Joi.boolean().required(),
  shipping: shippingSchema,
  timeline: Joi.string().trim().valid('asap', '1-3', '3-6', 'flexible').required(),

  // Step 3
  firstName: Joi.string().trim().min(1).max(80).required(),
  lastName: Joi.string().trim().min(1).max(80).required(),
  email: Joi.string().email().required(),
  phoneCountryCode: Joi.string().trim().max(10).optional(),
  phoneNumber: Joi.string().trim().min(1).max(20).required(),
  deliveryCity: Joi.string().trim().max(100).allow('').optional(),
  additionalNotes: Joi.string().trim().max(2000).allow('').optional(),
  consentContact: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must agree to be contacted regarding this request.',
  }),
});
