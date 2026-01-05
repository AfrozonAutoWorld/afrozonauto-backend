"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShipmentSchema = exports.createOrderSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const client_1 = require("../../generated/prisma/client");
exports.createOrderSchema = joi_1.default.object({
    userId: joi_1.default.string().required(),
    vehicleId: joi_1.default.string().required(),
    status: joi_1.default.string()
        .valid(...Object.values(client_1.OrderStatus))
        .optional(),
    shippingMethod: joi_1.default.string()
        .valid(...Object.values(client_1.ShippingMethod))
        .optional(),
    destinationCountry: joi_1.default.string().optional(),
    destinationState: joi_1.default.string().optional(),
    destinationCity: joi_1.default.string().optional(),
    destinationAddress: joi_1.default.string().optional(),
    priority: joi_1.default.string()
        .valid(...Object.values(client_1.OrderPriority))
        .optional(),
    customerNotes: joi_1.default.string().optional(),
    specialRequests: joi_1.default.string().optional(),
});
exports.createShipmentSchema = joi_1.default.object({
    orderId: joi_1.default.string().required(),
    shippingMethod: joi_1.default.string()
        .valid(...Object.values(client_1.ShippingMethod))
        .optional(),
    carrier: joi_1.default.string().optional(),
    carrierTrackingNumber: joi_1.default.string().optional(),
    status: joi_1.default.string()
        .valid(...Object.values(client_1.ShipmentStatus))
        .optional(),
});
