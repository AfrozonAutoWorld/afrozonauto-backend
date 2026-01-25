"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.createUserSchema = exports.forgotSchema = exports.userVerifySchema = exports.TokenValidationSchema = exports.loginSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const client_1 = require("../../generated/prisma/client");
const files_validation_1 = require("./files.validation");
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().optional()
});
exports.TokenValidationSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    token: joi_1.default.string().required(),
});
exports.userVerifySchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    token: joi_1.default.alternatives().try(joi_1.default.number().integer().positive(), joi_1.default.string().pattern(/^\d+$/).required()).required().custom((value) => {
        // Convert string to number if needed
        return typeof value === 'string' ? parseInt(value, 10) : value;
    }),
});
exports.forgotSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    token: joi_1.default.string().required(),
    newPassword: joi_1.default.string().optional()
});
exports.createUserSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().optional(),
    firstName: joi_1.default.string().required(),
    lastName: joi_1.default.string().required(),
    phone: joi_1.default.string().optional(),
    role: joi_1.default.string()
        .valid(...Object.values(client_1.UserRole))
        .optional(),
    isActive: joi_1.default.boolean().optional(),
});
exports.updateProfileSchema = joi_1.default.object({
    uploadedFiles: joi_1.default.array()
        .items(files_validation_1.fileInfoSchema)
        .optional(),
    // =========================
    // Personal Information
    // =========================
    firstName: joi_1.default.string()
        .trim()
        .min(2)
        .max(50)
        .optional(),
    lastName: joi_1.default.string()
        .trim()
        .min(2)
        .max(50)
        .optional(),
    dateOfBirth: joi_1.default.date()
        .less('now')
        .optional(),
    // =========================
    // KYC / Identification
    // =========================
    identificationNumber: joi_1.default.string()
        .trim()
        .min(5)
        .max(50)
        .optional(),
    identificationType: joi_1.default.string()
        .valid('passport', 'national_id', 'drivers_license', 'voters_card')
        .optional(),
    identificationDocument: joi_1.default.string()
        .uri()
        .optional(),
    // =========================
    // Business Information
    // =========================
    businessName: joi_1.default.string()
        .trim()
        .min(2)
        .max(100)
        .optional(),
    taxId: joi_1.default.string()
        .trim()
        .min(5)
        .max(50)
        .optional(),
})
    .min(1) // Must update at least one field
    .unknown(false); // Reject unknown fields
