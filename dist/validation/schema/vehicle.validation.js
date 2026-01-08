"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveVehicleSchema = exports.createVehicleSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const client_1 = require("../../generated/prisma/client");
exports.createVehicleSchema = joi_1.default.object({
    vin: joi_1.default.string().required(),
    slug: joi_1.default.string().required(),
    make: joi_1.default.string().required(),
    model: joi_1.default.string().required(),
    year: joi_1.default.number().integer().required(),
    vehicleType: joi_1.default.string()
        .valid(...Object.values(client_1.VehicleType))
        .required(),
    priceUsd: joi_1.default.number().required(),
    originalPriceUsd: joi_1.default.number().optional(),
    mileage: joi_1.default.number().integer().optional(),
    transmission: joi_1.default.string().optional(),
    fuelType: joi_1.default.string().optional(),
    images: joi_1.default.array().items(joi_1.default.string()).optional(),
    source: joi_1.default.string()
        .valid(...Object.values(client_1.VehicleSource))
        .optional(),
    status: joi_1.default.string()
        .valid(...Object.values(client_1.VehicleStatus))
        .optional(),
    availability: joi_1.default.string()
        .valid(...Object.values(client_1.VehicleAvailability))
        .optional(),
    featured: joi_1.default.boolean().optional(),
    isActive: joi_1.default.boolean().optional(),
    isHidden: joi_1.default.boolean().optional(),
});
exports.saveVehicleSchema = joi_1.default.object({
    userId: joi_1.default.string().required(),
    vehicleId: joi_1.default.string().required(),
});
