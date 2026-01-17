"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../config/inversify.config");
const types_1 = require("../config/types");
const authMiddleware_1 = require("../middleware/authMiddleware");
const bodyValidate_1 = require("../middleware/bodyValidate");
const joi_1 = __importDefault(require("joi"));
// Validation schema for payment initiation
const initPaymentSchema = joi_1.default.object({
    orderId: joi_1.default.string().required().messages({
        'string.empty': 'Order ID is required',
        'any.required': 'Order ID is required'
    }),
    amountUsd: joi_1.default.number().positive().required().messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be positive',
        'any.required': 'Amount in USD is required'
    }),
    provider: joi_1.default.string().valid('stripe', 'paystack', 'flutterwave').required().messages({
        'any.only': 'Provider must be one of: stripe, paystack, flutterwave',
        'any.required': 'Payment provider is required'
    }),
    paymentType: joi_1.default.string().valid('DEPOSIT', 'FULL_PAYMENT', 'BALANCE', 'REFUND', 'PARTIAL_REFUND').required().messages({
        'any.only': 'Payment type must be one of: DEPOSIT, FULL_PAYMENT, BALANCE, REFUND, PARTIAL_REFUND',
        'any.required': 'Payment type is required'
    })
});
class PaymentRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = inversify_config_1.container.get(types_1.TYPES.PaymentController);
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Initiate payment
        this.router.post('/init', authMiddleware_1.authenticate, (0, bodyValidate_1.validateBody)(initPaymentSchema), this.controller.initPayment);
        this.router.post('/webhooks/paystack', this.controller.paystackWebhook);
        this.router.post('/webhooks/stripe', this.controller.stripeWebhook);
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new PaymentRoutes().getRouter();
