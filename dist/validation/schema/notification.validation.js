"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const client_1 = require("../../generated/prisma/client");
exports.createNotificationSchema = joi_1.default.object({
    userId: joi_1.default.string().required(),
    orderId: joi_1.default.string().optional(),
    type: joi_1.default.string()
        .valid(...Object.values(client_1.NotificationType))
        .required(),
    title: joi_1.default.string().required(),
    message: joi_1.default.string().required(),
    actionUrl: joi_1.default.string().optional(),
    actionLabel: joi_1.default.string().optional(),
});
