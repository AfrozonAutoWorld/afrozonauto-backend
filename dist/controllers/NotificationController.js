"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const NotificationService_1 = require("../services/NotificationService");
const enums_1 = require("../generated/prisma/enums");
let NotificationController = class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
        this.getStats = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(this, void 0, void 0, function* () {
            const stats = yield this.notificationService.getAdminStats();
            return res.status(200).json(ApiResponse_1.ApiResponse.success(stats, 'Notification statistics retrieved'));
        }));
        this.getNotifications = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
            // Type filter
            const typeParam = (_a = req.query.type) === null || _a === void 0 ? void 0 : _a.toUpperCase();
            const type = typeParam && typeParam !== 'ALL' && Object.values(enums_1.NotificationType).includes(typeParam)
                ? typeParam
                : undefined;
            // Status filter: "pending" → isRead=false, "completed" → isRead=true, else undefined
            const statusParam = (_b = req.query.status) === null || _b === void 0 ? void 0 : _b.toLowerCase();
            const isRead = statusParam === 'completed' ? true :
                statusParam === 'pending' ? false :
                    undefined;
            const result = yield this.notificationService.getAdminNotifications({ type, isRead, page, limit });
            return res.status(200).json(ApiResponse_1.ApiResponse.paginated(result.notifications, { page: result.page, limit: result.limit, total: result.total, pages: result.pages }, 'Notifications retrieved'));
        }));
        this.markAsRead = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Notification ID is required'));
            }
            const updated = yield this.notificationService.markAsRead(id);
            if (!updated) {
                return res.status(404).json(ApiError_1.ApiError.notFound('Notification not found'));
            }
            return res.status(200).json(ApiResponse_1.ApiResponse.success(updated, 'Notification marked as read'));
        }));
        this.markAllAsRead = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.notificationService.markAllAdminAsRead();
            return res.status(200).json(ApiResponse_1.ApiResponse.success(result, 'All notifications marked as read'));
        }));
    }
};
exports.NotificationController = NotificationController;
exports.NotificationController = NotificationController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.NotificationService)),
    __metadata("design:paramtypes", [NotificationService_1.NotificationService])
], NotificationController);
