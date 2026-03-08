"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySellerSchema = exports.applyAsSellerSchema = exports.registerSellerSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.registerSellerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    phone: joi_1.default.string().optional(),
    firstName: joi_1.default.string().required(),
    lastName: joi_1.default.string().required(),
    businessName: joi_1.default.string().optional(),
    taxId: joi_1.default.string().optional(),
    identificationNumber: joi_1.default.string().optional(),
    identificationType: joi_1.default.string().optional(),
    uploadedFiles: joi_1.default.array().items(joi_1.default.object({
        url: joi_1.default.string().uri().required(),
        documentName: joi_1.default.string().required(), // businessRegistration, vendorNIN, etc.
        fileSize: joi_1.default.number().optional(),
        fileType: joi_1.default.string().optional(),
        format: joi_1.default.string().optional(),
        publicId: joi_1.default.string().optional(),
    })).min(1).required(), // Seller needs documents
});
exports.applyAsSellerSchema = joi_1.default.object({
    businessName: joi_1.default.string().optional(),
    taxId: joi_1.default.string().optional(),
    identificationNumber: joi_1.default.string().optional(),
    identificationType: joi_1.default.string().optional(),
    uploadedFiles: joi_1.default.array().items(joi_1.default.object({
        url: joi_1.default.string().uri().required(),
        documentName: joi_1.default.string().required(),
        fileSize: joi_1.default.number().optional(),
        fileType: joi_1.default.string().optional(),
        format: joi_1.default.string().optional(),
        publicId: joi_1.default.string().optional(),
    })).min(1).required(), // Seller needs documents
});
exports.verifySellerSchema = joi_1.default.object({
    approve: joi_1.default.boolean().required(),
    reason: joi_1.default.string().when('approve', {
        is: false,
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
});
