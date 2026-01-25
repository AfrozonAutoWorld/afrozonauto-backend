import Joi from 'joi';
import { fileInfoSchema } from './files.validation';

export const createTestimonialSchema = Joi.object({

  uploadedFiles: Joi.array()
    .items(fileInfoSchema)
    .optional(),

  orderId: Joi.string(),
  comment: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional(),
  vehicleSnapshot: Joi.object({
    make: Joi.string().required(),
    model: Joi.string().required(),
    year: Joi.number().integer().required()
    // Other known fields...
  }).unknown(true),
  rating: Joi.number()
    .min(0)
    .max(5)
    .default(0),


})
