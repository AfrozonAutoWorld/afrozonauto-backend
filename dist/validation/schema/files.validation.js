"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileInfoSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.fileInfoSchema = joi_1.default.object({
    url: joi_1.default.string().uri().required(),
    fileSize: joi_1.default.number().min(1).required(),
    fileType: joi_1.default.string(),
    format: joi_1.default.string().required(),
    publicId: joi_1.default.string().required(),
    imageName: joi_1.default.string().optional(),
    documentName: joi_1.default.string().valid('businessRegistration', 'vendorNIN', 'storeLogo').optional(),
});
