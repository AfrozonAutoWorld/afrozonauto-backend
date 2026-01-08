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
exports.GoogleAuthService = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const Jtoken_1 = __importDefault(require("../middleware/Jtoken"));
const inversify_1 = require("inversify");
const secrets_1 = require("../secrets");
const types_1 = require("../config/types");
const UserService_1 = require("./UserService");
const loggers_1 = __importDefault(require("../utils/loggers"));
const UserRepository_1 = require("../repositories/UserRepository");
const enums_1 = require("../generated/prisma/enums");
const ApiError_1 = require("../utils/ApiError");
let GoogleAuthService = class GoogleAuthService {
    constructor(userServices, userRepo, jtoken) {
        this.userServices = userServices;
        this.userRepo = userRepo;
        this.jtoken = jtoken;
        // Only initialize Passport if Google OAuth is configured
        if (this.isConfigured()) {
            this.initializePassport();
        }
        else {
            loggers_1.default.warn('Google authentication environment variables are missing. Google Sign-In will be disabled.');
        }
        this.tokenService = jtoken;
    }
    /**
     * Check if Google auth is configured
     */
    isConfigured() {
        return !!(secrets_1.GOOGLE_CLIENT_ID && secrets_1.GOOGLE_CLIENT_SECRET && secrets_1.GOOGLE_CALLBACK_URL);
    }
    initializePassport() {
        if (!this.isConfigured()) {
            loggers_1.default.warn('Cannot initialize Google OAuth - missing configuration');
            return;
        }
        passport_1.default.use(new passport_google_oauth20_1.Strategy({
            clientID: secrets_1.GOOGLE_CLIENT_ID,
            clientSecret: secrets_1.GOOGLE_CLIENT_SECRET,
            callbackURL: secrets_1.GOOGLE_CALLBACK_URL,
            scope: ['profile', 'email'],
            passReqToCallback: true,
        }, (req, accessToken, refreshToken, profile, done) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.handleGoogleUser(profile);
                if (!user) {
                    return done(null, false);
                }
                return done(null, user);
            }
            catch (error) {
                return done(error, undefined);
            }
        })));
        // Serialize user for session
        passport_1.default.serializeUser((user, done) => {
            done(null, user._id);
        });
        // Deserialize user from session
        passport_1.default.deserializeUser((id, done) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.userServices.findById(id);
                if (!user) {
                    return done(null, false);
                }
                done(null, user);
            }
            catch (error) {
                done(error, undefined);
            }
        }));
    }
    handleGoogleUser(profile) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            let email = null;
            if (profile.emails && profile.emails.length > 0) {
                email = profile.emails[0].value;
            }
            if (!email) {
                throw ApiError_1.ApiError.badRequest("Email not found linked");
            }
            const googleId = profile.id;
            let user = yield this.userServices.getUserByGoogleId(googleId);
            if (!user) {
                user = yield this.userServices.getUserByEmail(email);
                if (user) {
                    // Link Google account
                    user = yield this.userServices.updateUserInfo(user.id, {
                        googleId,
                        verified: true,
                    });
                }
                else {
                    const firstName = (_b = (_a = profile.name) === null || _a === void 0 ? void 0 : _a.givenName) !== null && _b !== void 0 ? _b : "";
                    const lastName = (_d = (_c = profile.name) === null || _c === void 0 ? void 0 : _c.familyName) !== null && _d !== void 0 ? _d : "";
                    const googlePhoto = {
                        url: (_g = (_f = (_e = profile.photos) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.value) !== null && _g !== void 0 ? _g : "",
                        fileSize: 0,
                        fileType: "image",
                        format: "jpeg",
                        publicId: googleId,
                        imageName: "google-profile-photo",
                        documentName: "storeLogo",
                    };
                    user = yield this.userRepo.createUser({
                        email,
                        googleId,
                        role: enums_1.UserRole.BUYER,
                        verified: true,
                        password: this.generateRandomPassword(),
                    }, {
                        firstName,
                        lastName,
                        photo: [googlePhoto]
                    });
                }
            }
            return user;
        });
    }
    generateRandomPassword() {
        return Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16);
    }
    generateTokens(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = {
                id: user.id.toString(),
                role: user.role,
                email: user.email,
            };
            return yield this.tokenService.createShortLivedToken(payload);
        });
    }
    getPassportMiddleware() {
        return passport_1.default.initialize();
    }
    getSessionMiddleware() {
        return passport_1.default.session();
    }
};
exports.GoogleAuthService = GoogleAuthService;
exports.GoogleAuthService = GoogleAuthService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.UserService)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.UserRepository)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.Jtoken)),
    __metadata("design:paramtypes", [UserService_1.UserService,
        UserRepository_1.UserRepository,
        Jtoken_1.default])
], GoogleAuthService);
