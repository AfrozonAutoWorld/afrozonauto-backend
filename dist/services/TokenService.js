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
const node_crypto_1 = require("node:crypto");
const inversify_1 = require("inversify");
const client_1 = require("../generated/prisma/client");
const types_1 = require("../config/types");
const MailService_1 = require("./MailService");
const ApiError_1 = require("../utils/ApiError");
const db_1 = __importDefault(require("../db"));
let TokenService = class TokenService {
    constructor(mailService) {
        this.mailService = mailService;
    }
    /* ----------------------------------------------------
       GENERATE TOKEN
    ---------------------------------------------------- */
    generateToken() {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, node_crypto_1.randomInt)(100000, 1000000);
        });
    }
    /* ----------------------------------------------------
       SEND EMAIL VERIFICATION TOKEN
    ---------------------------------------------------- */
    sendVerificationToken(userId, email) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = yield this.createVerificationToken(client_1.TokenType.EMAIL, userId, email);
            yield this.mailService.sendVerification(email, token);
        });
    }
    /* ----------------------------------------------------
       CREATE / REUSE VERIFICATION TOKEN
    ---------------------------------------------------- */
    createVerificationToken(type, userId, email) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId && !email) {
                throw ApiError_1.ApiError.badRequest('userId or email must be provided');
            }
            // Find latest unused token
            const existingToken = yield db_1.default.token.findFirst({
                where: Object.assign({ type, used: false }, (userId
                    ? { userId }
                    : { email })),
                orderBy: {
                    createdAt: 'desc',
                },
            });
            if (existingToken) {
                return existingToken.token;
            }
            const token = yield this.generateToken();
            const data = Object.assign(Object.assign({ token,
                type }, (userId && {
                user: {
                    connect: { id: userId },
                },
            })), (email && { email }));
            const created = yield db_1.default.token.create({ data });
            if (!created) {
                throw ApiError_1.ApiError.internal('Token saving failed');
            }
            return token;
        });
    }
    /* ----------------------------------------------------
       VALIDATE TOKEN
    ---------------------------------------------------- */
    /* ----------------------------------------------------
         VALIDATE TOKEN
      ---------------------------------------------------- */
    validateToken(token, identifier, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const whereConditions = Object.assign(Object.assign({ token: Number(token) }, (type ? { type } : {})), { used: false });
            // Handle both string identifier (email) or object identifier
            if (typeof identifier === 'string') {
                // It's a string - check if it's an email or userId
                if (identifier.includes('@')) {
                    whereConditions.email = identifier;
                }
                else {
                    whereConditions.userId = identifier;
                }
            }
            else {
                // It's an object with userId and/or email
                const orConditions = [];
                if (identifier.userId) {
                    orConditions.push({ userId: identifier.userId });
                }
                if (identifier.email) {
                    orConditions.push({ email: identifier.email });
                }
                if (orConditions.length > 0) {
                    whereConditions.OR = orConditions;
                }
            }
            return db_1.default.token.findFirst({
                where: whereConditions,
            });
        });
    }
    /* ----------------------------------------------------
      DELETE TOKENS FOR USER / EMAIL
   ---------------------------------------------------- */
    deleteToken(tokenIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, email } = tokenIdentifier;
            if (!userId && !email) {
                throw ApiError_1.ApiError.badRequest('Either userId or email must be provided to delete tokens');
            }
            return db_1.default.token.deleteMany({
                where: Object.assign(Object.assign({}, (userId ? { userId } : {})), (email ? { email } : {})),
            });
        });
    }
    /* ----------------------------------------------------
       MARK TOKEN AS USED
    ---------------------------------------------------- */
    updateTokenUsablility(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.token.update({
                where: { id },
                data: {
                    used: true,
                    usedAt: new Date(),
                },
            });
        });
    }
    /* ----------------------------------------------------
       INVALIDATE EXISTING TOKENS
    ---------------------------------------------------- */
    // async invalidateExistingTokens(
    //   identifier: string,
    //   type?: TokenType
    // ) {
    //   await prisma.token.updateMany({
    //     where: {
    //       usedAt: null,
    //       ...(type ? { type } : {}),
    //       OR: [
    //         { userId: identifier },
    //         { email: identifier },
    //       ],
    //     },
    //     data: {
    //       used: true,
    //       usedAt: new Date(),
    //     },
    //   });
    // }
    invalidateExistingTokens(userId, email, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const whereConditions = Object.assign({ usedAt: null }, (type ? { type } : {}));
            if (userId) {
                whereConditions.userId = userId;
            }
            else if (email) {
                whereConditions.email = email;
            }
            else {
                throw new Error('Either userId or email must be provided');
            }
            yield db_1.default.token.updateMany({
                where: whereConditions,
                data: {
                    used: true,
                    usedAt: new Date(),
                },
            });
        });
    }
    /* ----------------------------------------------------
       GET LAST USED TOKEN
    ---------------------------------------------------- */
    getUsedTokenForUser(identifier_1) {
        return __awaiter(this, arguments, void 0, function* (identifier, lastUsed = true) {
            return db_1.default.token.findFirst({
                where: Object.assign(Object.assign({ used: true }, (lastUsed && { usedAt: { not: null } })), identifier),
                orderBy: [
                    { usedAt: 'desc' },
                    { createdAt: 'desc' },
                ],
            });
        });
    }
};
TokenService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.MailService)),
    __metadata("design:paramtypes", [MailService_1.MailService])
], TokenService);
exports.default = TokenService;
