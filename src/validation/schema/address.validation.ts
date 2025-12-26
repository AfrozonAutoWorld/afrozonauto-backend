import Joi from 'joi';
import { AddressType } from '../../generated/prisma/client';


export const createAddressSchema = Joi.object({
  type: Joi.string().valid(...Object.values(AddressType)).optional(),

  street: Joi.string().optional().allow(null, ''),
  firstName: Joi.string().optional().allow(null, ''),
  lastName: Joi.string().optional().allow(null, ''),

  city: Joi.string().required(),

  state: Joi.string().optional().allow(null, ''),
  postalCode: Joi.string().optional().allow(null, ''),
  country: Joi.string().optional().allow(null, ''),

  isDefault: Joi.boolean().optional(),

  additionalInfo: Joi.string().optional().allow(null, ''),
  phoneNumber: Joi.string().optional().allow(null, ''),
  additionalPhoneNumber: Joi.string().optional().allow(null, ''),
});
