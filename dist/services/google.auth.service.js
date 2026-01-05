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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAuthService = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const user_services_1 = __importDefault(require("./user.services"));
const Jtoken_1 = __importDefault(require("../middlewares/Jtoken"));
const types_1 = require("../utils/types");
const secrets_1 = require("../secrets");
class GoogleAuthService {
    constructor() {
        this.tokenService = new Jtoken_1.default();
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
                const user = yield user_services_1.default.getUserById(id);
                done(null, user);
            }
            catch (error) {
                done(error, null);
            }
        }));
    }
    handleGoogleUser(profile) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const email = profile.emails[0].value;
            const googleId = profile.id;
            // Check if user exists with this Google ID
            let user = yield user_services_1.default.getUserByGoogleId(googleId);
            if (!user) {
                // Check if user exists with this email
                user = yield user_services_1.default.getUserByEmail(email);
                if (user) {
                    // Link Google account to existing user
                    user = yield user_services_1.default.updateUser(user._id.toString(), {
                        googleId,
                        emailVerified: true,
                    });
                }
                else {
                    // Create new user with Google account
                    user = yield user_services_1.default.createUser({
                        email,
                        googleId,
                        role: types_1.UserRole.USER,
                        emailVerified: true,
                        password: this.generateRandomPassword(),
                    }, {
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        image: (_a = profile.photos[0]) === null || _a === void 0 ? void 0 : _a.value,
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
                _id: user._id.toString(),
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
}
exports.GoogleAuthService = GoogleAuthService;
exports.default = new GoogleAuthService();
