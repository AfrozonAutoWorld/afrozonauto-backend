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
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const secrets_1 = require("../secrets");
const enums_1 = require("../generated/prisma/enums");
const UserService_1 = require("./UserService");
const inversify_config_1 = require("../config/inversify.config");
let GoogleAuthService = class GoogleAuthService {
    constructor(userService) {
        this.userService = userService;
        this.initializePassport();
    }
    initializePassport() {
        passport_1.default.use(new passport_google_oauth20_1.Strategy({
            clientID: secrets_1.GOOGLE_CLIENT_ID,
            clientSecret: secrets_1.GOOGLE_CLIENT_SECRET,
            callbackURL: secrets_1.GOOGLE_CALLBACK_URL,
            scope: ['profile', 'email'],
            passReqToCallback: true,
        }, (req, accessToken, refreshToken, profile, done) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.handleGoogleUser(profile);
                return done(null, user);
            }
            catch (error) {
                return done(error, null);
            }
        })));
        // Serialize user for session
        passport_1.default.serializeUser((user, done) => {
            done(null, user._id);
        });
        // Deserialize user from session
        passport_1.default.deserializeUser((id, done) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.userService.getUserById(id);
                done(null, user);
            }
            catch (error) {
                done(error, null);
            }
        }));
    }
    handleGoogleUser(profile) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
            if (!email) {
                throw new Error('Google account does not provide an email address');
            }
            const googleId = profile.id;
            // Check if user exists with this Google ID
            let user = yield this.userService.getUserByGoogleId(googleId);
            if (!user) {
                // Check if user exists with this email
                user = yield this.userService.getUserByEmail(email);
                if (user) {
                    // Link Google account
                    user = yield this.userService.updateUser(user.id.toString(), {
                        googleId,
                        emailVerified: true,
                    });
                }
                else {
                    // Create new user
                    user = yield this.userService.createUser({
                        email,
                        googleId,
                        role: enums_1.UserRole.BUYER,
                        emailVerified: true,
                        password: this.generateRandomPassword(),
                        firstName: (_d = (_c = profile.name) === null || _c === void 0 ? void 0 : _c.givenName) !== null && _d !== void 0 ? _d : undefined,
                        lastName: (_f = (_e = profile.name) === null || _e === void 0 ? void 0 : _e.familyName) !== null && _f !== void 0 ? _f : undefined,
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
                id: user._id.toString(),
                role: user.role,
                email: user.email,
            };
            const jtoken = inversify_config_1.container.get(types_1.TYPES.Jtoken);
            return yield jtoken.createShortLivedToken(payload);
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
    __param(0, (0, inversify_1.inject)(types_1.TYPES.UserRepository)),
    __metadata("design:paramtypes", [UserService_1.UserService])
], GoogleAuthService);
