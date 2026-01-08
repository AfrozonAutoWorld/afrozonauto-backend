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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const secrets_1 = require("../secrets");
const UserRepository_1 = require("../repositories/UserRepository");
const ApiError_1 = require("../utils/ApiError");
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const SHORT_EXPIRES_IN = "2m";
/**
 * JWT Token Service
 * @class Jtoken
 * @description Handles all JWT token operations including generation, verification, and refreshing
 *
 * @property {Secret} secret - JWT secret key from environment variables
 * @property {JwtExpiresIn} accessTokenExpiresIn - Expiration time for access tokens
 * @property {JwtExpiresIn} refreshTokenExpiresIn - Expiration time for refresh tokens
 */
let Jtoken = class Jtoken {
    /**
     * @constructor
     * @param {UserRepository} userRepository - Injected user repository instance
     * @throws {Error} If required environment variables are missing
     * @description Initializes JWT service with configuration from environment variables
     */
    constructor(userRepository) {
        this.userRepository = userRepository;
        /**
         * Creates a short-lived token for temporary operations
         * @async
         * @param {JWTPayload} payload - The payload to include in token
         * @returns {Promise<string>} Short-lived JWT token
         *
         * @example
         * await createShortLivedToken({ id: "123", role: "BUYER", email: "user@example.com" })
         * // returns "xxx.yyy.zzz" (expires in 2 minutes)
         */
        this.createShortLivedToken = (payload) => __awaiter(this, void 0, void 0, function* () {
            return jsonwebtoken_1.default.sign(payload, this.secret, { expiresIn: SHORT_EXPIRES_IN });
        });
        const missingVars = [];
        if (!secrets_1.JWT_SECRET)
            missingVars.push('JWT_SECRET');
        if (!secrets_1.EXPIRES_IN_SHORT)
            missingVars.push('EXPIRES_IN_SHORT');
        if (!secrets_1.EXPIRES_IN_LONG)
            missingVars.push('EXPIRES_IN_LONG');
        if (missingVars.length > 0) {
            throw new Error(`Missing required JWT environment variables: ${missingVars.join(', ')}. ` +
                `Please add these to your .env file.`);
        }
        this.secret = secrets_1.JWT_SECRET;
        this.accessTokenExpiresIn = this.parseExpiration(secrets_1.EXPIRES_IN_SHORT);
        this.refreshTokenExpiresIn = this.parseExpiration(secrets_1.EXPIRES_IN_LONG);
    }
    /**
     * Parses expiration time into valid JWT format
     * @private
     * @param {string|number} expiration - The expiration time to parse
     * @returns {JwtExpiresIn} Properly formatted expiration time
     * @throws {Error} If expiration format is invalid
     *
     * @example
     * parseExpiration(3600) // returns 3600 (seconds)
     * parseExpiration("1 h") // returns "1 h"
     * parseExpiration("invalid") // throws Error
     */
    parseExpiration(expiration) {
        if (typeof expiration === 'number')
            return expiration;
        // Check for valid string format (e.g., "2 days")
        const parts = expiration.toString().split(/\s+/);
        if (parts.length !== 2) {
            throw ApiError_1.ApiError.internal(`Invalid expiration format: ${expiration}. Expected format like "2 days"`);
        }
        const value = parseInt(parts[0]);
        if (isNaN(value)) {
            throw ApiError_1.ApiError.internal(`Invalid number in expiration: ${expiration}`);
        }
        const unit = parts[1].toLowerCase();
        if (!['ms', 's', 'm', 'h', 'd', 'y'].includes(unit)) {
            throw ApiError_1.ApiError.internal(`Invalid time unit in expiration: ${expiration}. Valid units: ms, s, m, h, d, y`);
        }
        return `${value} ${unit}`;
    }
    /**
     * Generates new JWT token pair (access + refresh)
     * @async
     * @param {JWTPayload} payload - The payload to include in tokens
     * @returns {Promise<{accessToken: string, refreshToken: string}>} Token pair
     * @throws {Error} If token generation fails
     *
     * @example
     * await createToken({ id: "123", role: "BUYER", email: "user@example.com" })
     * // returns { accessToken: "xxx", refreshToken: "yyy" }
     */
    createToken(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const accessTokenOptions = { expiresIn: this.accessTokenExpiresIn };
            const refreshTokenOptions = { expiresIn: this.refreshTokenExpiresIn };
            try {
                const [accessToken, refreshToken] = yield Promise.all([
                    this.signToken(payload, accessTokenOptions),
                    this.signToken(payload, refreshTokenOptions)
                ]);
                return {
                    accessToken: accessToken,
                    refreshToken: refreshToken
                };
            }
            catch (error) {
                throw ApiError_1.ApiError.internal("Failed to generate authentication tokens");
            }
        });
    }
    /**
     * Signs a JWT token with given payload and options
     * @private
     * @async
     * @param {string|object|Buffer} payload - Data to include in token
     * @param {SignOptions} options - Signing options
     * @returns {Promise<string>} Signed JWT token
     * @throws {Error} If signing fails
     */
    signToken(payload, options) {
        return new Promise((resolve, reject) => {
            jsonwebtoken_1.default.sign(payload, this.secret, options, (err, token) => {
                if (err || !token) {
                    reject(ApiError_1.ApiError.internal("Token generation failed", { originalError: err === null || err === void 0 ? void 0 : err.message }));
                    return;
                }
                resolve(token);
            });
        });
    }
    /**
     * Verifies and decodes a JWT token
     * @async
     * @param {string} token - JWT token to verify
     * @returns {Promise<JWTPayload|null>} Decoded payload if valid, null otherwise
     *
     * @example
     * await verifyToken("xxx.yyy.zzz")
     * // returns { id: "123", role: "BUYER", email: "user@example.com", ... } or null if invalid
     */
    verifyToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                jsonwebtoken_1.default.verify(token, this.secret, (err, decoded) => {
                    if (err) {
                        console.error("Token verification failed:", err);
                        return resolve(null);
                    }
                    resolve(decoded);
                });
            });
        });
    }
    /**
     * Refreshes an access token using a valid refresh token
     * @async
     * @param {string} refreshToken - Valid refresh token
     * @returns {Promise<{accessToken: string, refreshToken: string, user: Omit<User, 'passwordHash'>}|null>}
     *          New token pair with user data or null if refresh fails
     *
     * @example
     * await refreshAccessToken("refresh.xxx.yyy")
     * // returns { accessToken: "new.xxx", refreshToken: "new.yyy", user: { ... } }
     */
    refreshAccessToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const decoded = yield this.verifyToken(refreshToken);
            if (!decoded) {
                throw ApiError_1.ApiError.unauthorized("Invalid refresh token");
            }
            const user = yield this.userRepository.findById(decoded.id);
            if (!user) {
                throw ApiError_1.ApiError.unauthorized("User not found");
            }
            try {
                const { passwordHash } = user, userData = __rest(user, ["passwordHash"]);
                const payload = {
                    id: user.id,
                    role: user.role,
                    email: user.email
                };
                const { accessToken, refreshToken: newRefreshToken } = yield this.createToken(payload);
                return {
                    accessToken,
                    refreshToken: newRefreshToken,
                    user: userData
                };
            }
            catch (error) {
                throw ApiError_1.ApiError.unauthorized("Session expired. Please log in again.");
            }
        });
    }
};
Jtoken = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.UserRepository)),
    __metadata("design:paramtypes", [UserRepository_1.UserRepository])
], Jtoken);
exports.default = Jtoken;
