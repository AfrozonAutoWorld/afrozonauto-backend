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
exports.AdminDashboardController = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const AdminDashboardService_1 = require("../services/AdminDashboardService");
let AdminDashboardController = class AdminDashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
        this.getDashboardStats = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(this, void 0, void 0, function* () {
            const stats = yield this.dashboardService.getDashboardStats();
            return res.status(200).json(ApiResponse_1.ApiResponse.success(stats, 'Dashboard statistics retrieved'));
        }));
        this.getPendingOrders = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
            const result = yield this.dashboardService.getPendingOrders(page, limit);
            return res.status(200).json(ApiResponse_1.ApiResponse.paginated(result.orders, { page: result.page, limit: result.limit, total: result.total, pages: result.pages }, 'Pending orders retrieved'));
        }));
        this.getRecentActivity = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
            const activity = yield this.dashboardService.getRecentActivity(limit);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(activity, 'Recent activity retrieved'));
        }));
    }
};
exports.AdminDashboardController = AdminDashboardController;
exports.AdminDashboardController = AdminDashboardController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.AdminDashboardService)),
    __metadata("design:paramtypes", [AdminDashboardService_1.AdminDashboardService])
], AdminDashboardController);
