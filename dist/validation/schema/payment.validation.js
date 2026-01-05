"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentSchema = void 0;
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
