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
exports.UserController = void 0;
const UserService_1 = require("../services/UserService");
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
let UserController = class UserController {
    constructor(userService) {
        this.userService = userService;
        this.getUserByEmail = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.params;
            if (!email) {
                throw ApiError_1.ApiError.badRequest('Email parameter is required');
            }
            const user = yield this.userService.getUserByEmail(email);
            if (!user) {
                throw ApiError_1.ApiError.notFound('User not found');
            }
            res.json(new ApiResponse_1.ApiResponse(200, user, 'User retrieved successfully'));
        }));
        this.verifyUser = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { userId } = req.params;
            if (!userId) {
                throw ApiError_1.ApiError.badRequest('User ID parameter is required');
            }
            const result = yield this.userService.getUserById(userId);
            if (!result) {
                throw ApiError_1.ApiError.internal('Verification failed');
            }
            res.json(new ApiResponse_1.ApiResponse(200, { verified: true }, 'User verified successfully'));
        }));
        this.deactivateAccount = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { userId } = req.params;
            if (!userId) {
                throw ApiError_1.ApiError.badRequest('User ID parameter is required');
            }
            const result = yield this.userService.deleteUser(userId);
            if (!result) {
                throw ApiError_1.ApiError.internal('Deactivation failed');
            }
            res.json(new ApiResponse_1.ApiResponse(200, { deactivated: true }, 'Account deactivated successfully'));
        }));
        this.updatePassword = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { userId } = req.params;
            const { newPassword } = req.body;
            if (!userId) {
                throw ApiError_1.ApiError.badRequest('User ID parameter is required');
            }
            if (!newPassword) {
                throw ApiError_1.ApiError.badRequest('New password is required');
            }
            if (newPassword.length < 6) {
                throw ApiError_1.ApiError.badRequest('Password must be at least 6 characters long');
            }
            const result = yield this.userService.updateUserPassword(userId, newPassword);
            if (!result) {
                throw ApiError_1.ApiError.internal('Password update failed');
            }
            res.json(new ApiResponse_1.ApiResponse(200, { updated: true }, 'Password updated successfully'));
        }));
    }
};
exports.UserController = UserController;
exports.UserController = UserController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.UserService)),
    __metadata("design:paramtypes", [UserService_1.UserService])
], UserController);
