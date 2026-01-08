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
exports.MailService = void 0;
const mailer_1 = __importDefault(require("../utils/mailer"));
const mailer_templates_1 = require("../utils/mailer.templates");
const secrets_1 = require("../secrets");
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const UserRepository_1 = require("../repositories/UserRepository");
const ProfileService_1 = require("./ProfileService");
let MailService = class MailService {
    constructor(userRepository, profileService) {
        this.userRepository = userRepository;
        this.profileService = profileService;
    }
    sendVerification(email, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const html = (0, mailer_templates_1.otpDisplay)(token.toString());
            yield (0, mailer_1.default)(email, 'Verify Your Email Address', html);
        });
    }
    vendorWelcome(email, recipientName, ctaText, ctaUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const html = mailer_templates_1.emailTemplates.welcomeVendor({
                recipientName,
                ctaText,
                ctaUrl,
            });
            yield (0, mailer_1.default)(email, 'Verify Your Email Address', html);
        });
    }
    WelcomeBuyer(email, recipientName, ctaText, ctaUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const html = mailer_templates_1.emailTemplates.welcomeBuyer({
                recipientName,
                ctaText,
                ctaUrl,
            });
            yield (0, mailer_1.default)(email, 'Verify Your Email Address', html);
        });
    }
    sendPasswordReset(email, token, profile) {
        return __awaiter(this, void 0, void 0, function* () {
            const html = mailer_templates_1.emailTemplates.passwordReset({
                otp: token.toString(),
                subject: 'Password Reset Code',
                description: 'Password Reset Code',
                recipientName: (profile === null || profile === void 0 ? void 0 : profile.firstName) || 'Anonymous',
                expirationMinutes: Number(secrets_1.TOKEN_EXPIRY_MINUTES || 10),
            });
            yield (0, mailer_1.default)(email, 'Password Reset Code', html);
        });
    }
    accountRecovery(email, token, firstName) {
        return __awaiter(this, void 0, void 0, function* () {
            const html = mailer_templates_1.emailTemplates.accountRecovery({
                recipientName: firstName || 'Anonymous',
                otp: token.toString(),
                subject: "Account Recovery",
                description: "Account Recovery",
                expirationMinutes: Number(secrets_1.TOKEN_EXPIRY_MINUTES || 10)
            });
            yield (0, mailer_1.default)(email, 'Account Recovery', html);
        });
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.AddressRepository)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.ProfileService)),
    __metadata("design:paramtypes", [UserRepository_1.UserRepository,
        ProfileService_1.ProfileService])
], MailService);
