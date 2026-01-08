"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAddressSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const client_1 = require("../../generated/prisma/client");
exports.createAddressSchema = joi_1.default.object({
    type: joi_1.default.string().valid(...Object.values(client_1.AddressType)).optional(),
    street: joi_1.default.string().optional().allow(null, ''),
    firstName: joi_1.default.string().optional().allow(null, ''),
    lastName: joi_1.default.string().optional().allow(null, ''),
    city: joi_1.default.string().required(),
    state: joi_1.default.string().optional().allow(null, ''),
    postalCode: joi_1.default.string().optional().allow(null, ''),
    country: joi_1.default.string().optional().allow(null, ''),
    isDefault: joi_1.default.boolean().optional(),
    additionalInfo: joi_1.default.string().optional().allow(null, ''),
    phoneNumber: joi_1.default.string().optional().allow(null, ''),
    additionalPhoneNumber: joi_1.default.string().optional().allow(null, ''),
});
