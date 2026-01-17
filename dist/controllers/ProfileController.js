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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const inversify_1 = require("inversify");
const ProfileService_1 = require("../services/ProfileService");
const types_1 = require("../config/types");
const UserService_1 = require("../services/UserService");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const password_1 = require("../utils/password");
let ProfileController = class ProfileController {
    constructor(profileService, userService) {
        this.profileService = profileService;
        this.userService = userService;
        this.create = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const _a = req.body, { uploadedFiles } = _a, data = __rest(_a, ["uploadedFiles"]);
            if (!req.user) {
                return res.status(401).json(ApiError_1.ApiError.unauthorized('User not authenticated'));
            }
            const userId = req.user.id;
            const uploadedFilex = req.body.uploadedFiles || [];
            const result = yield this.profileService.create(Object.assign(Object.assign({}, data), { files: uploadedFilex }), userId.toString());
            return res.status(201).json(new ApiResponse_1.ApiResponse(201, result, 'Profile created successfully'));
        }));
        this.getById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield this.profileService.findById(req.params.id);
            if (!result) {
                return res.status(404).json(ApiError_1.ApiError.notFound('Profile not found'));
            }
            return res.json(new ApiResponse_1.ApiResponse(200, result, 'Profile retrieved successfully'));
        }));
        this.update = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const _b = req.body, { uploadedFiles, phoneNumber } = _b, data = __rest(_b, ["uploadedFiles", "phoneNumber"]);
            if (!req.user) {
                return res.status(401).json(ApiError_1.ApiError.unauthorized('User not authenticated'));
            }
            const userId = req.user.id;
            const uploadedFilex = req.body.uploadedFiles || [];
            const promises = [
                this.profileService.update(userId.toString(), Object.assign(Object.assign({}, data), { files: uploadedFilex }))
            ];
            if (phoneNumber) {
                promises.push(this.userService.updateUserInfo(userId, { phoneNumber }));
            }
            yield Promise.all(promises);
            const userInfo = yield this.userService.getUserByEmail((_a = req.user) === null || _a === void 0 ? void 0 : _a.email);
            const profile = __rest(userInfo, []);
            return res.json(ApiResponse_1.ApiResponse.success(Object.assign({}, profile), 'Profile updated successfully'));
        }));
        this.delete = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.profileService.delete(req.params.id);
            res.status(204).send();
        }));
        this.list = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(this, void 0, void 0, function* () {
            const profiles = yield this.profileService.findAll();
            res.json(new ApiResponse_1.ApiResponse(200, profiles, 'Profiles retrieved successfully'));
        }));
        this.currentUserProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.user) {
                return res.status(401).json(ApiError_1.ApiError.unauthorized('User not authenticated'));
            }
            const userId = req.user.id;
            const [profiles] = yield Promise.all([
                this.profileService.findUserById(userId.toString()),
            ]);
            return res.json(new ApiResponse_1.ApiResponse(200, profiles, 'User profile retrieved successfully'));
        }));
        this.resetPassword = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { oldPassword, newPassword } = req.body;
            if (!req.user) {
                return res.status(401).json(ApiError_1.ApiError.unauthorized('User not authenticated'));
            }
            if (!oldPassword || !newPassword) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Old password and new password are required'));
            }
            if (newPassword.length < 6) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('New password must be at least 6 characters long'));
            }
            const user = yield this.userService.findById(req.user.id);
            if (!user || !user.passwordHash) {
                return res.status(404).json(ApiError_1.ApiError.notFound('User not found'));
            }
            const isMatch = yield (0, password_1.comparePassword)(oldPassword, user.passwordHash);
            if (!isMatch) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Old password is incorrect'));
            }
            const isSameAsOld = yield (0, password_1.comparePassword)(newPassword, user.passwordHash);
            if (isSameAsOld) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('New password cannot be the same as the old password'));
            }
            const hashed = yield (0, password_1.hashPassword)(newPassword);
            yield this.userService.updateUser(user.id, {
                passwordHash: hashed,
            });
            return res.status(200).json(ApiResponse_1.ApiResponse.success(null, 'Password reset successfully'));
        }));
    }
};
exports.ProfileController = ProfileController;
exports.ProfileController = ProfileController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.ProfileService)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.UserService)),
    __metadata("design:paramtypes", [ProfileService_1.ProfileService,
        UserService_1.UserService])
], ProfileController);
