"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.createUserSchema = exports.forgotSchema = exports.userVerifySchema = exports.TokenValidationSchema = exports.loginSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const client_1 = require("../../generated/prisma/client");
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
    token: joi_1.default.string().required(),
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
    avatar: joi_1.default.string().optional(),
    businessName: joi_1.default.string().optional(),
    taxId: joi_1.default.string().optional(),
    isVerified: joi_1.default.boolean().optional(),
});
