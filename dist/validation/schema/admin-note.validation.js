"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminNoteSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createAdminNoteSchema = joi_1.default.object({
    orderId: joi_1.default.string().optional(),
    userId: joi_1.default.string().optional(),
    note: joi_1.default.string().required(),
    isInternal: joi_1.default.boolean().optional(),
    category: joi_1.default.string().optional(),
});
