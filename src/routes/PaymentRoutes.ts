import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { PaymentController } from '../controllers/PaymentController';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/bodyValidate';
import Joi from 'joi';

// Validation schema for payment initiation
const initPaymentSchema = Joi.object({
  orderId: Joi.string().required().messages({
    'string.empty': 'Order ID is required',
    'any.required': 'Order ID is required'
  }),
  amountUsd: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount in USD is required'
  }),
  provider: Joi.string().valid('stripe', 'paystack', 'flutterwave').required().messages({
    'any.only': 'Provider must be one of: stripe, paystack, flutterwave',
    'any.required': 'Payment provider is required'
  }),
  paymentType: Joi.string().valid('DEPOSIT', 'FULL_PAYMENT', 'BALANCE', 'REFUND', 'PARTIAL_REFUND').required().messages({
    'any.only': 'Payment type must be one of: DEPOSIT, FULL_PAYMENT, BALANCE, REFUND, PARTIAL_REFUND',
    'any.required': 'Payment type is required'
  })
});

class PaymentRoutes {
  private router: Router;
  private controller: PaymentController;

  constructor() {
    this.router = Router();
    this.controller = container.get<PaymentController>(TYPES.PaymentController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Initiate payment
    this.router.post('/init', authenticate, validateBody(initPaymentSchema), this.controller.initPayment);
    
    this.router.post('/webhooks/paystack', this.controller.paystackWebhook);
    this.router.post('/webhooks/stripe', this.controller.stripeWebhook);
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new PaymentRoutes().getRouter();
