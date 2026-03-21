"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPaymentSchema = exports.bankTransferInitiateSchema = exports.createPaymentSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const client_1 = require("../../generated/prisma/client");
exports.createPaymentSchema = joi_1.default.object({
    orderId: joi_1.default.string().required(),
    userId: joi_1.default.string().required(),
    amountUsd: joi_1.default.number().required(),
    amountLocal: joi_1.default.number().optional(),
    paymentType: joi_1.default.string()
        .valid(...Object.values(client_1.PaymentType))
        .required(),
    paymentMethod: joi_1.default.string()
        .valid(...Object.values(client_1.PaymentMethod))
        .optional(),
    paymentProvider: joi_1.default.string().optional(),
    transactionRef: joi_1.default.string().optional(),
    description: joi_1.default.string().optional(),
});
// Validation schema for bank transfer one-shot initiation
exports.bankTransferInitiateSchema = joi_1.default.object({
    identifier: joi_1.default.string().required().messages({
        'string.empty': 'Vehicle identifier (VIN or temp-id) is required',
        'any.required': 'Vehicle identifier (VIN or temp-id) is required',
    }),
    type: joi_1.default.string().valid('id', 'vin').default('id'),
    vehicleId: joi_1.default.string().optional(),
    shippingMethod: joi_1.default.string()
        .valid(...Object.values(client_1.ShippingMethod))
        .required()
        .messages({
        'any.only': `shippingMethod must be one of: ${Object.values(client_1.ShippingMethod).join(', ')}`,
        'any.required': 'Shipping method is required',
    }),
    paymentType: joi_1.default.string()
        .valid(...Object.values(client_1.PaymentType))
        .default('DEPOSIT'),
    customerNotes: joi_1.default.string().optional().allow(''),
    deliveryInstructions: joi_1.default.string().optional().allow(''),
    specialRequests: joi_1.default.string().optional().allow(''),
    uploadedFiles: joi_1.default.array().items(joi_1.default.object({
        url: joi_1.default.string().uri().required(),
        documentName: joi_1.default.string().required(),
        fileSize: joi_1.default.number().optional(),
        fileType: joi_1.default.string().optional(),
        format: joi_1.default.string().optional(),
        publicId: joi_1.default.string().optional(),
    })).min(1).required()
});
// Validation schema for payment initiation
exports.initPaymentSchema = joi_1.default.object({
    orderId: joi_1.default.string().required().messages({
        'string.empty': 'Order ID is required',
        'any.required': 'Order ID is required'
    }),
    provider: joi_1.default.string().valid('stripe', 'paystack', 'flutterwave').required().messages({
        'any.only': 'Provider must be one of: stripe, paystack, flutterwave',
        'any.required': 'Payment provider is required'
    }),
    callbackUrl: joi_1.default.string().required(),
    paymentType: joi_1.default.string()
        .valid(...Object.values(client_1.PaymentType))
        .optional(),
});
