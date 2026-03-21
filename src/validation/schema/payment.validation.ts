import Joi from 'joi';
import { PaymentType, PaymentMethod, ShippingMethod } from '../../generated/prisma/client';

export const createPaymentSchema = Joi.object({
  orderId: Joi.string().required(),
  userId: Joi.string().required(),

  amountUsd: Joi.number().required(),
  amountLocal: Joi.number().optional(),

  paymentType: Joi.string()
    .valid(...Object.values(PaymentType))
    .required(),

  paymentMethod: Joi.string()
    .valid(...Object.values(PaymentMethod))
    .optional(),

  paymentProvider: Joi.string().optional(),
  transactionRef: Joi.string().optional(),
  description: Joi.string().optional(),
});



// Validation schema for bank transfer one-shot initiation
export const bankTransferInitiateSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'string.empty': 'Vehicle identifier (VIN or temp-id) is required',
    'any.required': 'Vehicle identifier (VIN or temp-id) is required',
  }),
  type: Joi.string().valid('id', 'vin').default('id'),
  vehicleId: Joi.string().optional(),
  shippingMethod: Joi.string()
    .valid(...Object.values(ShippingMethod))
    .required()
    .messages({
      'any.only': `shippingMethod must be one of: ${Object.values(ShippingMethod).join(', ')}`,
      'any.required': 'Shipping method is required',
    }),
  paymentType: Joi.string()
    .valid(...Object.values(PaymentType))
    .default('DEPOSIT'),
  customerNotes: Joi.string().optional().allow(''),
  deliveryInstructions: Joi.string().optional().allow(''),
  specialRequests: Joi.string().optional().allow(''),
  uploadedFiles: Joi.array().items(Joi.object({
    url: Joi.string().uri().required(),
    documentName: Joi.string().required(),
    fileSize: Joi.number().optional(),
    fileType: Joi.string().optional(),
    format: Joi.string().optional(),
    publicId: Joi.string().optional(),
  })).min(1).required()
});

// Validation schema for payment initiation
export const initPaymentSchema = Joi.object({
  orderId: Joi.string().required().messages({
    'string.empty': 'Order ID is required',
    'any.required': 'Order ID is required'
  }),
  provider: Joi.string().valid('stripe', 'paystack', 'flutterwave').required().messages({
    'any.only': 'Provider must be one of: stripe, paystack, flutterwave',
    'any.required': 'Payment provider is required'
  }),
  callbackUrl: Joi.string().required(),
  paymentType: Joi.string()
    .valid(...Object.values(PaymentType))
    .optional(),

});
