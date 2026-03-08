"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSourcingRequestSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const conditionSchema = joi_1.default.string().valid('used', 'new', 'either').required();
const shippingSchema = joi_1.default.string().valid('roro', 'container').required();
exports.createSourcingRequestSchema = joi_1.default.object({
    // Step 1
    make: joi_1.default.string().trim().min(1).max(100).required(),
    model: joi_1.default.string().trim().min(1).max(120).required(),
    yearFrom: joi_1.default.string().allow('').optional(),
    yearTo: joi_1.default.string().allow('').optional(),
    trim: joi_1.default.string().trim().max(120).allow('').optional(),
    condition: conditionSchema,
    // Step 2
    budgetUsd: joi_1.default.string().trim().max(20).required(),
    exteriorColor: joi_1.default.string().trim().max(50).required(),
    anyColor: joi_1.default.boolean().required(),
    shipping: shippingSchema,
    timeline: joi_1.default.string().trim().valid('asap', '1-3', '3-6', 'flexible').required(),
    // Step 3
    firstName: joi_1.default.string().trim().min(1).max(80).required(),
    lastName: joi_1.default.string().trim().min(1).max(80).required(),
    email: joi_1.default.string().email().required(),
    phoneCountryCode: joi_1.default.string().trim().max(10).optional(),
    phoneNumber: joi_1.default.string().trim().min(1).max(20).required(),
    deliveryCity: joi_1.default.string().trim().max(100).allow('').optional(),
    additionalNotes: joi_1.default.string().trim().max(2000).allow('').optional(),
    consentContact: joi_1.default.boolean().valid(true).required().messages({
        'any.only': 'You must agree to be contacted regarding this request.',
    }),
});
