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
exports.SellerController = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const SellerService_1 = require("../services/SellerService");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const client_1 = require("../generated/prisma/client");
let SellerController = class SellerController {
    constructor(service) {
        this.service = service;
        /**
         * specialized registration for sellers (guest -> pending seller)
         */
        this.registerSeller = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { user, profile } = yield this.service.registerSeller(req.body);
            return res.status(201).json(ApiResponse_1.ApiResponse.created({ user, profile }, 'Seller registered. An email verification code has been sent. Account pending verification.'));
        }));
        /**
         * applying as seller (authenticated user -> pending seller)
         */
        this.applyAsSeller = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.user)
                throw ApiError_1.ApiError.unauthorized('User not authenticated');
            const profile = yield this.service.applyAsSeller(req.user.id, req.body);
            return res.json(ApiResponse_1.ApiResponse.success(profile, 'Seller application submitted for review. Account pending verification.'));
        }));
        /**
         * Admin: getApplications (admin)
         */
        this.getApplications = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.SUPER_ADMIN && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== client_1.UserRole.OPERATIONS_ADMIN) {
                throw ApiError_1.ApiError.forbidden('Admin access required');
            }
            const { status } = req.query;
            const applications = yield this.service.getApplications(status);
            return res.json(ApiResponse_1.ApiResponse.success(applications, 'Applications retrieved successfully'));
        }));
        /**
         * Admin: verifySeller (admin)
         */
        this.verifySeller = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.SUPER_ADMIN && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== client_1.UserRole.OPERATIONS_ADMIN) {
                throw ApiError_1.ApiError.forbidden('Admin access required');
            }
            const { id } = req.params;
            const { approve, reason } = req.body;
            const profile = yield this.service.verifySeller(id, approve, reason);
            const message = approve ? 'Seller verified successfully' : 'Seller application rejected';
            return res.json(ApiResponse_1.ApiResponse.success(profile, message));
        }));
    }
};
exports.SellerController = SellerController;
exports.SellerController = SellerController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.SellerService)),
    __metadata("design:paramtypes", [SellerService_1.SellerService])
], SellerController);
