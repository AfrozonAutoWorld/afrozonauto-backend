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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
const TokenService_1 = __importDefault(require("../services/TokenService"));
const UserService_1 = require("../services/UserService");
const AuthService_1 = require("../services/AuthService");
let SellerController = class SellerController {
    constructor(service, tokenService, userService, authService) {
        this.service = service;
        this.tokenService = tokenService;
        this.userService = userService;
        this.authService = authService;
        /**
         * Part 1: Check email and send verification token for new seller
         */
        this.checkSellerEmail = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            if (!email)
                throw ApiError_1.ApiError.badRequest('Email is required');
            const user = yield this.userService.getUserByEmail(email);
            if (user)
                throw ApiError_1.ApiError.badRequest('User already exists');
            yield this.tokenService.sendVerificationToken(undefined, email);
            return res.json(ApiResponse_1.ApiResponse.success({ email }, 'Verification token sent to email'));
        }));
        /**
         * Part 2: Verify the token sent to the email
         */
        this.verifySellerEmail = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email, token } = req.body;
            if (!email || !token)
                throw ApiError_1.ApiError.badRequest('Email and token are required');
            const tokenNumber = typeof token === 'string' ? parseInt(token, 10) : Number(token);
            yield this.authService.verifyUser(email, tokenNumber);
            return res.json(ApiResponse_1.ApiResponse.success(null, 'Email verified successfully'));
        }));
        /**
         * Part 3: specialized registration for sellers (guest -> pending seller)
         * This requires the email to have been verified in Parts 1 & 2.
         */
        this.registerSeller = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            // Validate that email has been verified via token
            const usedToken = yield this.tokenService.getUsedTokenForUser({ email });
            if (!usedToken) {
                throw ApiError_1.ApiError.badRequest('Please verify your email before registering');
            }
            const { user, profile } = yield this.service.registerSeller(req.body);
            // Clean up the used token record
            yield this.tokenService.deleteToken({ email });
            return res.status(201).json(ApiResponse_1.ApiResponse.created({ user, profile }, 'Seller registered successfully. Account pending administrative verification.'));
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
    __param(1, (0, inversify_1.inject)(types_1.TYPES.TokenService)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.UserService)),
    __param(3, (0, inversify_1.inject)(types_1.TYPES.AuthService)),
    __metadata("design:paramtypes", [SellerService_1.SellerService,
        TokenService_1.default,
        UserService_1.UserService,
        AuthService_1.AuthService])
], SellerController);
