"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestimonialSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const files_validation_1 = require("./files.validation");
exports.createTestimonialSchema = joi_1.default.object({
    uploadedFiles: joi_1.default.array()
        .items(files_validation_1.fileInfoSchema)
        .optional(),
    orderId: joi_1.default.string(),
    comment: joi_1.default.string()
        .trim()
        .min(2)
        .max(50)
        .optional(),
    vehicleSnapshot: joi_1.default.object({
        make: joi_1.default.string().required(),
        model: joi_1.default.string().required(),
        year: joi_1.default.number().integer().required()
        // Other known fields...
    }).unknown(true),
    rating: joi_1.default.number()
        .min(0)
        .max(5)
        .default(0),
});
