"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSellerVehicleStatusSchema = exports.createSellerVehicleSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const client_1 = require("../../generated/prisma/client");
exports.createSellerVehicleSchema = joi_1.default.object({
    // Step 1: Vehicle Details
    year: joi_1.default.number().integer().min(1900).max(new Date().getFullYear() + 1).required(),
    make: joi_1.default.string().required(),
    model: joi_1.default.string().required(),
    trim: joi_1.default.string().allow('', null).optional(),
    bodyStyle: joi_1.default.string().allow('', null).optional(),
    mileage: joi_1.default.number().integer().min(0).required(),
    vin: joi_1.default.string().allow('', null).optional(),
    transmission: joi_1.default.string().allow('', null).optional(),
    drivetrain: joi_1.default.string().allow('', null).optional(),
    fuelType: joi_1.default.string().allow('', null).optional(),
    exteriorColor: joi_1.default.string().allow('', null).optional(),
    cylinders: joi_1.default.number().integer().min(0).optional(),
    // Step 2: Vehicle Condition
    condition: joi_1.default.string()
        .valid(...Object.values(client_1.VehicleListingCondition))
        .required(),
    titleStatus: joi_1.default.array().items(joi_1.default.string()).required(), // [Clean title, etc.]
    accidentHistory: joi_1.default.string().required(), // No accidents, Minor, Major, Unknown
    knownIssues: joi_1.default.array().items(joi_1.default.string()).default([]),
    keys: joi_1.default.number().integer().min(0).optional(),
    features: joi_1.default.array().items(joi_1.default.string()).optional(),
    highlights: joi_1.default.array().items(joi_1.default.string()).optional(),
    modifications: joi_1.default.string().allow('', null).optional(),
    // Step 3: Photos & Price
    uploadedFiles: joi_1.default.array()
        .items(joi_1.default.object({
        url: joi_1.default.string().uri().required(),
        fileSize: joi_1.default.number().min(0).required(),
        fileType: joi_1.default.string().optional(),
        format: joi_1.default.string().required(),
        publicId: joi_1.default.string().required(),
        imageName: joi_1.default.string().optional(),
        documentName: joi_1.default.string().allow(null, '').optional(),
        uploadIndex: joi_1.default.number().optional(),
    }))
        .optional(),
    askingPrice: joi_1.default.number().positive().required(),
    showAskingPrice: joi_1.default.boolean().default(true),
    allowOffers: joi_1.default.boolean().default(true),
    additionalNotes: joi_1.default.string().allow('', null).optional(),
    // Step 4: Contact Details (Mapping to contactFirstName etc in model)
    contactFirstName: joi_1.default.string().required(),
    contactLastName: joi_1.default.string().required(),
    contactEmail: joi_1.default.string().email().required(),
    contactPhone: joi_1.default.string().required(),
    city: joi_1.default.string().required(),
    zipCode: joi_1.default.string().required(),
    preferredContact: joi_1.default.string().valid('Email', 'Phone', 'SMS').optional(),
    bestTimeToReach: joi_1.default.string().optional(),
    variants: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.array().items(joi_1.default.object({
        name: joi_1.default.string(),
        options: joi_1.default.array().items(joi_1.default.object({
            name: joi_1.default.string(),
            price: joi_1.default.number(),
            // Add other option fields as needed
        }))
    }))).optional(),
    address: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object({
        street: joi_1.default.string(),
        city: joi_1.default.string(),
        state: joi_1.default.string(),
        zipCode: joi_1.default.string(),
        country: joi_1.default.string()
    })).optional(),
    variantImageIndexes: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.array().items(joi_1.default.number().min(1)))).optional(),
    documentName: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.array().items(joi_1.default.string())).optional(),
});
exports.updateSellerVehicleStatusSchema = joi_1.default.object({
    status: joi_1.default.string()
        .valid(...Object.values(client_1.VehicleStatus))
        .required(),
    adminNotes: joi_1.default.string().allow('', null).optional(),
});
