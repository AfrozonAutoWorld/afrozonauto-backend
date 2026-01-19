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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const inversify_1 = require("inversify");
const AuthService_1 = require("../services/AuthService");
const types_1 = require("../config/types");
const Jtoken_1 = __importDefault(require("../middleware/Jtoken"));
const db_1 = __importDefault(require("../db"));
const client_1 = require("../generated/prisma/client");
const UserService_1 = require("../services/UserService");
const TokenService_1 = __importDefault(require("../services/TokenService"));
const MailService_1 = require("../services/MailService");
const ProfileService_1 = require("../services/ProfileService");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const loggers_1 = __importDefault(require("../utils/loggers"));
const oauth_config_1 = __importDefault(require("../config/oauth.config"));
const secrets_1 = require("../secrets");
const GoogleAuthService_1 = require("../services/GoogleAuthService");
const UserRepository_1 = require("../repositories/UserRepository");
const AppleAuthService_1 = require("../services/AppleAuthService");
const inversify_config_1 = require("../config/inversify.config");
let AuthController = class AuthController {
    constructor(authService, userService, profileService, appleAuth, mailService, tokenService, userRepo, googleAuthService, jtoken) {
        this.authService = authService;
        this.userService = userService;
        this.profileService = profileService;
        this.appleAuth = appleAuth;
        this.mailService = mailService;
        this.tokenService = tokenService;
        this.userRepo = userRepo;
        this.googleAuthService = googleAuthService;
        this.jtoken = jtoken;
        this.checkUser = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Email address is required'));
            }
            const user = yield this.userService.getUserByEmail(email);
            if (user) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('User already exists'));
            }
            yield this.tokenService.sendVerificationToken(undefined, email);
            return res.json(new ApiResponse_1.ApiResponse(200, { email }, 'Verification token sent to email'));
        }));
        this.sendRecoveryEmailToken = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { recoveryEmail } = req.body;
            if (!recoveryEmail) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Recovery email address is required'));
            }
            yield this.tokenService.sendVerificationToken(undefined, recoveryEmail);
            return res.status(200).json(ApiResponse_1.ApiResponse.success({ recoveryEmail }, 'Verification token sent to recovery email'));
        }));
        this.verify = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email, token } = req.body;
            if (!email || !token) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Email and token are required'));
            }
            // Ensure token is a number
            const tokenNumber = typeof token === 'string' ? parseInt(token, 10) : Number(token);
            yield this.authService.verifyUser(email, tokenNumber);
            return res.json(ApiResponse_1.ApiResponse.success(null, 'Email verified successfully'));
        }));
        this.register = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const _a = req.body, { firstName, lastName } = _a, value = __rest(_a, ["firstName", "lastName"]);
            if (!value.email) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Email is required'));
            }
            const validateTokenVerification = yield this.tokenService.getUsedTokenForUser({ email: value.email });
            console.log(validateTokenVerification);
            if (!validateTokenVerification) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Please complete token validation for your account'));
            }
            const user = yield this.authService.register(value);
            yield this.profileService.updateProfileByUserId(user.id.toString(), { firstName, lastName });
            if (!user) {
                res.status(500).json(ApiError_1.ApiError.internal('User registration failed'));
            }
            yield this.tokenService.deleteToken({ email: value.email });
            return res.status(201).json(ApiResponse_1.ApiResponse.created({ success: true }, 'Registration successful'));
        }));
        this.registerFinalization = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const _a = req.body, { email } = _a, others = __rest(_a, ["email"]);
            if (!email) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Email is required'));
            }
            const user = yield this.userService.getUserByEmail(email);
            if (!user) {
                return res.status(404).json(ApiError_1.ApiError.notFound('User does not exist'));
            }
            const userUpdated = yield this.userService.updateUserInfo(user.id, Object.assign({ email }, others));
            if (!userUpdated) {
                return res.status(500).json(ApiError_1.ApiError.internal('Failed to update user information'));
            }
            const { passwordHash } = userUpdated, safeUser = __rest(userUpdated, ["passwordHash"]);
            return res.json(ApiResponse_1.ApiResponse.success({ user: safeUser }, 'User information updated successfully'));
        }));
        this.login = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Email and password are required'));
            }
            const userLogged = yield this.authService.login(email, password);
            const { passwordHash: pass } = userLogged, user = __rest(userLogged, ["passwordHash"]);
            const jtoken = inversify_config_1.container.get(types_1.TYPES.Jtoken);
            const { accessToken, refreshToken } = yield jtoken.createToken({
                email: user.email,
                role: user.role,
                id: user.id.toString()
            });
            return res.json(new ApiResponse_1.ApiResponse(200, {
                user: Object.assign(Object.assign({}, user), { online: true }),
                accessToken,
                refreshToken
            }, 'Login successful'));
        }));
        this.sendReset = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Email is required'));
            }
            const user = yield this.authService.sendResetToken(email);
            return res.json(ApiResponse_1.ApiResponse.success({}, 'Reset token sent to email'));
        }));
        this.resetPassword = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email, token, newPassword } = req.body;
            if (!email || !token || !newPassword) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Email, token, and new password are required'));
            }
            // Pass identifier as an object with email property
            yield this.authService.resetPassword({ email }, token, newPassword);
            return res.json(new ApiResponse_1.ApiResponse(200, null, 'Password reset successful'));
        }));
        this.tokenValidation = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email, token } = req.body;
            if (!email || !token) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Email and token are required'));
            }
            const userExist = yield this.userService.getUserByEmail(email);
            if (!userExist) {
                return res.status(400).json(ApiError_1.ApiError.notFound('User does not exist'));
            }
            const tokenValid = yield this.tokenService.validateToken(token.toString(), email);
            return res.json(new ApiResponse_1.ApiResponse(200, {
                tokenValid,
            }, 'Token validation completed'));
        }));
        this.refreshToken = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const refreshToken = req.body.token;
            if (!refreshToken) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Refresh token is required'));
            }
            // Get Jtoken instance from container
            const jtoken = inversify_config_1.container.get(types_1.TYPES.Jtoken);
            const refreshResult = yield jtoken.refreshAccessToken(refreshToken);
            if (!refreshResult) {
                return res.status(400).json(ApiError_1.ApiError.unauthorized("Invalid or expired refresh token"));
            }
            // Return the new access token and user data
            return res.status(200).json(ApiResponse_1.ApiResponse.success({
                accessToken: refreshResult.accessToken,
                refreshToken: refreshResult.refreshToken,
                user: refreshResult.user
            }, "Token refreshed successfully"));
        }));
        /**
         * Google login using ID token
        */
        this.verifyGoogleToken = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { code } = req.body;
            if (!code) {
                return res.status(400).json(ApiError_1.ApiError.badRequest("Missing authorization code"));
            }
            const { tokens } = yield oauth_config_1.default.getToken(code);
            oauth_config_1.default.setCredentials(tokens);
            if (!tokens.id_token) {
                return res.status(500).json(ApiError_1.ApiError.unauthorized("Failed to get Google ID token"));
            }
            const ticket = yield oauth_config_1.default.verifyIdToken({
                idToken: tokens.id_token,
                audience: secrets_1.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!(payload === null || payload === void 0 ? void 0 : payload.email)) {
                return res.status(400).json(ApiError_1.ApiError.unauthorized("Google account has no email"));
            }
            const { email, sub: googleId, picture, given_name, family_name, } = payload;
            let user = yield this.userService.getUserByEmail(email);
            if (!user) {
                user = yield db_1.default.user.create({
                    data: {
                        email,
                        googleId,
                        role: client_1.UserRole.BUYER,
                        emailVerified: true,
                        profile: {
                            create: {
                                firstName: given_name !== null && given_name !== void 0 ? given_name : "",
                                lastName: family_name !== null && family_name !== void 0 ? family_name : "",
                                files: picture
                                    ? {
                                        create: {
                                            url: picture,
                                            fileSize: 1024,
                                            fileType: "image",
                                            format: "jpeg",
                                            publicId: googleId,
                                            imageName: "google-profile-photo",
                                            documentName: client_1.DocumentName.storeLogo,
                                        },
                                    }
                                    : undefined,
                            },
                        },
                    },
                    include: {
                        profile: { include: { files: true } },
                    },
                });
            }
            if (!user) {
                return res.status(503).json(ApiError_1.ApiError.internal("User creation failed"));
            }
            const jtoken = inversify_config_1.container.get(types_1.TYPES.Jtoken);
            const { accessToken, refreshToken } = yield jtoken.createToken({
                email: user.email,
                role: user.role,
                id: user.id,
            });
            return res.status(200).json({
                status: true,
                message: "Google Login successful",
                user,
                accessToken,
                refreshToken,
            });
        }));
        /**
         * Initiate Apple Sign-In flow
         */
        this.initiateAppleSignIn = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const state = require('crypto').randomBytes(16).toString('hex');
                // Store state in secure HTTP-only cookie
                res.cookie('apple_auth_state', state, {
                    httpOnly: true,
                    secure: secrets_1.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 10 * 60 * 1000 // 10 minutes
                });
                const authUrl = this.appleAuth.getAuthorizationUrl(state);
                return res.status(200).json({
                    success: true,
                    authUrl
                });
            }
            catch (error) {
                loggers_1.default.error('Error initiating Apple Sign-In:', error);
                throw error;
            }
        }));
    }
};
exports.AuthController = AuthController;
exports.AuthController = AuthController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.AuthService)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.UserService)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.ProfileService)),
    __param(3, (0, inversify_1.inject)(types_1.TYPES.AppleAuthService)),
    __param(4, (0, inversify_1.inject)(types_1.TYPES.MailService)),
    __param(5, (0, inversify_1.inject)(types_1.TYPES.TokenService)),
    __param(6, (0, inversify_1.inject)(types_1.TYPES.UserRepository)),
    __param(7, (0, inversify_1.inject)(types_1.TYPES.GoogleAuthService)),
    __param(8, (0, inversify_1.inject)(types_1.TYPES.Jtoken)),
    __metadata("design:paramtypes", [AuthService_1.AuthService,
        UserService_1.UserService,
        ProfileService_1.ProfileService,
        AppleAuthService_1.AppleAuthService,
        MailService_1.MailService,
        TokenService_1.default,
        UserRepository_1.UserRepository,
        GoogleAuthService_1.GoogleAuthService,
        Jtoken_1.default])
], AuthController);
