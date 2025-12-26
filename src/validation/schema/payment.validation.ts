import Joi from 'joi';
import { PaymentType, PaymentMethod } from '../../generated/prisma/client';

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
