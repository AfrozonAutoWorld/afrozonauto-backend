import Joi from 'joi';
import { PlatformBankAccountCurrency } from '../../generated/prisma/client';

const currencies = Object.values(PlatformBankAccountCurrency);

export const createPlatformBankAccountSchema = Joi.object({
  label: Joi.string().required().messages({
    'any.required': 'Account label is required',
    'string.empty': 'Account label cannot be empty',
  }),

  bankName: Joi.string().required().messages({
    'any.required': 'Bank name is required',
  }),

  bankCode: Joi.string().optional(),

  accountName: Joi.string().required().messages({
    'any.required': 'Account name (beneficiary) is required',
  }),

  accountNumber: Joi.string().required().messages({
    'any.required': 'Account number is required',
  }),

  currency: Joi.string()
    .valid(...currencies)
    .required()
    .messages({
      'any.only': `Currency must be one of: ${currencies.join(', ')}`,
      'any.required': 'Currency is required',
    }),

  country: Joi.string().length(2).uppercase().required().messages({
    'any.required': 'Country (ISO alpha-2) is required',
    'string.length': 'Country must be a 2-letter ISO code (e.g. NG, US, GB)',
  }),

  // International wire fields — at least one of swiftCode or routingNumber
  // when currency is USD/GBP/EUR, but we leave this flexible for now
  swiftCode: Joi.string().optional(),
  iban: Joi.string().optional(),
  sortCode: Joi.string().optional(),
  routingNumber: Joi.string().optional(),
  bankAddress: Joi.string().optional(),

  isPrimary: Joi.boolean().optional().default(false),
  displayOrder: Joi.number().integer().min(0).optional().default(0),
  instructions: Joi.string().optional().allow(''),
  notes: Joi.string().optional().allow(''),
});

export const updatePlatformBankAccountSchema = Joi.object({
  label: Joi.string().optional(),
  bankName: Joi.string().optional(),
  bankCode: Joi.string().optional(),
  accountName: Joi.string().optional(),
  accountNumber: Joi.string().optional(),

  currency: Joi.string()
    .valid(...currencies)
    .optional(),

  country: Joi.string().length(2).uppercase().optional(),

  swiftCode: Joi.string().optional().allow('', null),
  iban: Joi.string().optional().allow('', null),
  sortCode: Joi.string().optional().allow('', null),
  routingNumber: Joi.string().optional().allow('', null),
  bankAddress: Joi.string().optional().allow('', null),

  isActive: Joi.boolean().optional(),
  isPrimary: Joi.boolean().optional(),
  displayOrder: Joi.number().integer().min(0).optional(),
  instructions: Joi.string().optional().allow('', null),
  notes: Joi.string().optional().allow('', null),
}).min(1).messages({
  'object.min': 'At least one field must be provided to update',
});
