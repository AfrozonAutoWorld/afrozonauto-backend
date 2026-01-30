"use strict";
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
exports.requireSuperAdmin = exports.requireCustomer = exports.requireAdmin = exports.requireRoles = exports.authorize = exports.authenticate = void 0;
const UserRepository_1 = require("../repositories/UserRepository");
const client_1 = require("../generated/prisma/client");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const types_1 = require("../config/types");
const inversify_config_1 = require("../config/inversify.config");
// Get Jtoken instance from container
const jtoken = inversify_config_1.container.get(types_1.TYPES.Jtoken);
const userRepository = new UserRepository_1.UserRepository();
exports.authenticate = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const header = req.header('Authorization');
    // const token = req.cookies?.access_token;
    if (!header || !header.startsWith('Bearer ')) {
        throw ApiError_1.ApiError.unauthorized('Authentication required');
    }
    const token = header.replace('Bearer ', '').trim();
    if (!token) {
        throw ApiError_1.ApiError.unauthorized('Authentication required');
    }
    const payload = yield jtoken.verifyToken(token);
    if (!payload || !payload.id) {
        throw ApiError_1.ApiError.unauthorized('Invalid or expired token');
    }
    const user = yield userRepository.findById(payload.id);
    if (!user) {
        throw ApiError_1.ApiError.unauthorized('User not found');
    }
    if (!user.isActive) {
        throw ApiError_1.ApiError.forbidden('Account is inactive');
    }
    if (user.isSuspended) {
        throw ApiError_1.ApiError.forbidden(user.suspensionReason || 'Account is suspended');
    }
    req.user = user;
    next();
}));
const authorize = (requiredRoles) => (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        throw ApiError_1.ApiError.unauthorized('Authentication required');
    }
    if (!requiredRoles.includes(req.user.role)) {
        throw ApiError_1.ApiError.forbidden(`Access restricted to: ${requiredRoles.join(', ')}`);
    }
    next();
}));
exports.authorize = authorize;
const requireRoles = (roles) => (0, exports.authorize)(roles);
exports.requireRoles = requireRoles;
exports.requireAdmin = (0, exports.authorize)([
    client_1.UserRole.SUPER_ADMIN,
    client_1.UserRole.OPERATIONS_ADMIN,
]);
exports.requireCustomer = (0, exports.authorize)([client_1.UserRole.BUYER]);
exports.requireSuperAdmin = (0, exports.authorize)([client_1.UserRole.SUPER_ADMIN]);
