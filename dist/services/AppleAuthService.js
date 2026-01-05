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
exports.AppleAuthService = void 0;
const apple_signin_auth_1 = __importDefault(require("apple-signin-auth"));
const loggers_1 = __importDefault(require("../utils/loggers"));
const ApiError_1 = require("../utils/ApiError");
const secrets_1 = require("../secrets");
const inversify_1 = require("inversify");
let AppleAuthService = class AppleAuthService {
    constructor() {
        this.options = {
            clientID: secrets_1.APPLE_CLIENT_ID || '',
            teamID: secrets_1.APPLE_TEAM_ID || '',
            privateKey: secrets_1.APPLE_PRIVATE_KEY || '',
            keyIdentifier: secrets_1.APPLE_KEY_IDENTIFIER || '',
            redirectUri: secrets_1.APPLE_REDIRECT_URI || ''
        };
        // Log warning if Apple auth is not configured, but don't throw
        // This allows the app to start without Apple Sign-In configured
        if (!this.options.clientID ||
            !this.options.teamID ||
            !this.options.privateKey ||
            !this.options.keyIdentifier ||
            !this.options.redirectUri) {
            loggers_1.default.warn('Apple authentication environment variables are missing. Apple Sign-In will be disabled.');
        }
    }
    /**
     * Check if Apple auth is configured
     */
    isConfigured() {
        return !!(this.options.clientID &&
            this.options.teamID &&
            this.options.privateKey &&
            this.options.keyIdentifier &&
            this.options.redirectUri);
    }
    /**
     * Get Apple authorization URL
     */
    getAuthorizationUrl(state, scope) {
        if (!this.isConfigured()) {
            throw ApiError_1.ApiError.badRequest('Apple authentication is not configured');
        }
        try {
            const authUrl = apple_signin_auth_1.default.getAuthorizationUrl({
                clientID: this.options.clientID,
                redirectUri: this.options.redirectUri,
                state: state || this.generateState(),
                scope: scope || 'email name',
                responseMode: 'form_post'
            });
            loggers_1.default.info('Generated Apple authorization URL');
            return authUrl;
        }
        catch (error) {
            loggers_1.default.error('Error generating authorization URL:', error.message);
            throw ApiError_1.ApiError.internal('Failed to generate authorization URL', error);
        }
    }
    /**
     * Exchange authorization code for tokens
     */
    getAuthorizationToken(code) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const clientSecret = this.generateClientSecret();
                const tokenResponse = yield apple_signin_auth_1.default.getAuthorizationToken(code, {
                    clientID: this.options.clientID,
                    redirectUri: this.options.redirectUri,
                    clientSecret
                });
                loggers_1.default.info('Successfully exchanged authorization code for tokens');
                return tokenResponse;
            }
            catch (error) {
                loggers_1.default.error('Error exchanging authorization code:', error.message);
                throw ApiError_1.ApiError.badRequest('Failed to exchange authorization code', error);
            }
        });
    }
    /**
     * Verify ID token and extract user information
     */
    verifyIdToken(idToken, audience, nonce) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const decoded = yield apple_signin_auth_1.default.verifyIdToken(idToken, {
                    audience: audience || this.options.clientID,
                    nonce,
                    ignoreExpiration: false
                });
                loggers_1.default.info(`ID token verified for user: ${decoded.sub}`);
                return decoded;
            }
            catch (error) {
                loggers_1.default.error('Error verifying ID token:', error.message);
                throw ApiError_1.ApiError.unauthorized('Invalid or expired ID token', error);
            }
        });
    }
    /**
     * Refresh access token using refresh token
     */
    refreshAuthorizationToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const clientSecret = this.generateClientSecret();
                const { access_token } = yield apple_signin_auth_1.default.refreshAuthorizationToken(refreshToken, {
                    clientID: this.options.clientID,
                    clientSecret
                });
                loggers_1.default.info('Successfully refreshed access token');
                return access_token;
            }
            catch (error) {
                loggers_1.default.error('Error refreshing authorization token:', error.message);
                throw ApiError_1.ApiError.badRequest('Failed to refresh token', error);
            }
        });
    }
    /**
     * Revoke refresh token (logout)
     */
    revokeRefreshToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const clientSecret = this.generateClientSecret();
                yield apple_signin_auth_1.default.revokeAuthorizationToken(refreshToken, {
                    clientID: this.options.clientID,
                    clientSecret,
                    tokenTypeHint: 'refresh_token'
                });
                loggers_1.default.info('Successfully revoked refresh token');
            }
            catch (error) {
                loggers_1.default.error('Error revoking refresh token:', error.message);
                // Don't throw - revocation failure shouldn't block logout
                loggers_1.default.warn('Continuing with logout despite revocation failure');
            }
        });
    }
    /**
     * Revoke access token
     */
    revokeAccessToken(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const clientSecret = this.generateClientSecret();
                yield apple_signin_auth_1.default.revokeAuthorizationToken(accessToken, {
                    clientID: this.options.clientID,
                    clientSecret,
                    tokenTypeHint: 'access_token'
                });
                loggers_1.default.info('Successfully revoked access token');
            }
            catch (error) {
                loggers_1.default.warn('Error revoking access token:', error.message);
            }
        });
    }
    /**
     * Verify webhook token from Apple server-to-server notifications
     */
    verifyWebhookToken(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const decoded = yield apple_signin_auth_1.default.verifyWebhookToken(payload, {
                    audience: this.options.clientID
                });
                loggers_1.default.info('Webhook token verified');
                return decoded;
            }
            catch (error) {
                loggers_1.default.error('Error verifying webhook token:', error.message);
                throw ApiError_1.ApiError.unauthorized('Invalid webhook token', error);
            }
        });
    }
    /**
     * Generate client secret (JWT)
     */
    generateClientSecret() {
        return apple_signin_auth_1.default.getClientSecret({
            clientID: this.options.clientID,
            teamID: this.options.teamID,
            privateKey: this.options.privateKey,
            keyIdentifier: this.options.keyIdentifier,
            expAfter: 15777000
        });
    }
    /**
     * Generate state for CSRF protection
     */
    generateState() {
        return require('crypto').randomBytes(16).toString('hex');
    }
};
exports.AppleAuthService = AppleAuthService;
exports.AppleAuthService = AppleAuthService = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [])
], AppleAuthService);
