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
exports.AuthService = void 0;
const inversify_1 = require("inversify");
const bcrypt_1 = __importDefault(require("bcrypt"));
const node_crypto_1 = require("node:crypto");
const db_1 = __importDefault(require("../db"));
const MailService_1 = require("./MailService");
const TokenService_1 = __importDefault(require("./TokenService"));
const ProfileService_1 = require("./ProfileService");
const ApiError_1 = require("../utils/ApiError");
const types_1 = require("../config/types");
const client_1 = require("../generated/prisma/client");
let AuthService = class AuthService {
    constructor(mailService, tokenService, profileService) {
        this.mailService = mailService;
        this.tokenService = tokenService;
        this.profileService = profileService;
    }
    // ============================
    // REGISTER
    // ============================
    register(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const existing = yield db_1.default.user.findUnique({
                where: { email: data.email },
            });
            if (existing) {
                throw ApiError_1.ApiError.badRequest('User already exists');
            }
            const passwordHash = yield bcrypt_1.default.hash(data.password, 10);
            // MongoDB unique constraints don't allow multiple null values
            const uniqueGoogleId = `local_${(0, node_crypto_1.randomUUID)()}`;
            const uniqueAppleId = `local_${(0, node_crypto_1.randomUUID)()}`;
            const user = yield db_1.default.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    phone: data.phone,
                    role: (_a = data.role) !== null && _a !== void 0 ? _a : client_1.UserRole.BUYER,
                    emailVerified: true,
                    googleId: uniqueGoogleId,
                    appleId: uniqueAppleId,
                },
            });
            // Send verification token
            yield this.tokenService.sendVerificationToken(user.id, user.email);
            return user;
        });
    }
    // ============================
    // VERIFY EMAIL
    // ============================
    verifyUser(email, token) {
        return __awaiter(this, void 0, void 0, function* () {
            // Test token bypass for development/testing (token: 999999)
            const TEST_TOKEN = 999999;
            const isTestToken = token === TEST_TOKEN;
            const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';
            if (isTestToken && isDevelopment) {
                try {
                    const existingUsedToken = yield this.tokenService.getUsedTokenForUser({ email }, true);
                    if (existingUsedToken) {
                        return true; // Already verified
                    }
                    yield db_1.default.token.deleteMany({
                        where: {
                            email: email,
                            type: client_1.TokenType.EMAIL,
                            used: false,
                        },
                    });
                    // Create a used token record for test token
                    yield db_1.default.token.create({
                        data: {
                            token: TEST_TOKEN,
                            type: client_1.TokenType.EMAIL,
                            email: email,
                            used: true,
                            usedAt: new Date(),
                        },
                    });
                }
                catch (error) {
                    // If creation fails, try to find existing used token
                    const existingUsedToken = yield this.tokenService.getUsedTokenForUser({ email }, true);
                    if (!existingUsedToken) {
                        // Log the actual error for debugging
                        console.error('Test token verification error:', (error === null || error === void 0 ? void 0 : error.message) || error);
                        throw ApiError_1.ApiError.internal(`Failed to create verification record: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`);
                    }
                }
                return true;
            }
            const tokenRecord = yield this.tokenService.validateToken(token, { email }, client_1.TokenType.EMAIL);
            if (!tokenRecord) {
                // Check if token exists but is already used
                const usedToken = yield db_1.default.token.findFirst({
                    where: {
                        token: Number(token),
                        email,
                        type: client_1.TokenType.EMAIL,
                        used: true,
                    },
                });
                if (usedToken) {
                    throw ApiError_1.ApiError.badRequest('This token has already been used. Please request a new verification token.');
                }
                // Check if any token exists for this email
                const anyToken = yield db_1.default.token.findFirst({
                    where: {
                        email,
                        type: client_1.TokenType.EMAIL,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                });
                if (!anyToken) {
                    throw ApiError_1.ApiError.badRequest('No verification token found for this email. Please request a new token.');
                }
                throw ApiError_1.ApiError.badRequest('Invalid token. Please check the token and try again, or request a new verification token.');
            }
            yield this.tokenService.updateTokenUsablility(tokenRecord.id);
            return true;
        });
    }
    // ============================
    // LOGIN
    // ============================
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield db_1.default.user.findUnique({
                where: { email },
                include: {
                    profile: true,
                },
            });
            if (!user) {
                throw ApiError_1.ApiError.notFound('User not found');
            }
            if (!user.emailVerified) {
                yield this.tokenService.sendVerificationToken(user.id, user.email);
                throw ApiError_1.ApiError.badRequest('Email not verified. A new verification code has been sent.');
            }
            if (!user.isActive || user.isSuspended) {
                throw ApiError_1.ApiError.badRequest('Account is suspended');
            }
            if (!user.passwordHash) {
                throw ApiError_1.ApiError.badRequest('Password authentication not enabled');
            }
            const match = yield bcrypt_1.default.compare(password, user.passwordHash);
            if (!match) {
                throw ApiError_1.ApiError.badRequest('Invalid credentials');
            }
            yield db_1.default.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
            return user;
        });
    }
    // ============================
    // SEND PASSWORD RESET
    // ============================
    sendResetToken(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield db_1.default.user.findUnique({
                where: { email },
            });
            if (!user) {
                throw ApiError_1.ApiError.notFound('User not found');
            }
            const profile = yield this.profileService.findUserById(user.id);
            const token = yield this.tokenService.generateToken();
            yield this.tokenService.invalidateExistingTokens(undefined, email, client_1.TokenType.PASSWORD_RESET);
            yield db_1.default.token.create({
                data: {
                    email,
                    token,
                    type: client_1.TokenType.PASSWORD_RESET,
                },
            });
            yield this.mailService.sendPasswordReset(email, token, profile !== null && profile !== void 0 ? profile : undefined);
            return user;
        });
    }
    // ============================
    // RESET PASSWORD
    // ============================
    resetPassword(identifier, token, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate the token with the email identifier
            const user = yield db_1.default.user.findUnique({
                where: { email: identifier.email },
            });
            if (!user) {
                throw ApiError_1.ApiError.notFound('User not found');
            }
            const tokenRecord = yield this.tokenService.validateToken(token, { email: identifier.email }, client_1.TokenType.PASSWORD_RESET // or whatever type you use
            );
            if (!tokenRecord) {
                throw ApiError_1.ApiError.badRequest('Invalid or expired token');
            }
            const passwordHash = yield bcrypt_1.default.hash(newPassword, 10);
            yield db_1.default.user.update({
                where: { id: user.id },
                data: { passwordHash },
            });
            yield this.tokenService.updateTokenUsablility(tokenRecord.id);
            return true;
        });
    }
    // ============================
    // RESEND VERIFICATION
    // ============================
    resendVerification(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield db_1.default.user.findUnique({
                where: { email },
            });
            if (!user) {
                throw ApiError_1.ApiError.notFound('User not found');
            }
            if (user.emailVerified) {
                throw ApiError_1.ApiError.badRequest('Email already verified');
            }
            yield this.tokenService.sendVerificationToken(user.id, user.email);
            return true;
        });
    }
    // ============================
    // DELETE USER
    // ============================
    deleteUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.user.delete({
                where: { id: userId },
            });
            return true;
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.MailService)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.TokenService)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.ProfileService)),
    __metadata("design:paramtypes", [MailService_1.MailService,
        TokenService_1.default,
        ProfileService_1.ProfileService])
], AuthService);
