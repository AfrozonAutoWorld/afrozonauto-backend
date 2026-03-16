"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.UserService = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const UserRepository_1 = require("../repositories/UserRepository");
const bcrypt_1 = __importDefault(require("bcrypt"));
const node_crypto_1 = require("node:crypto");
const enums_1 = require("../generated/prisma/enums");
const db_1 = __importDefault(require("../db"));
const client_1 = require("../generated/prisma/client");
const ApiError_1 = require("../utils/ApiError");
let UserService = class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    createUser(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, role, googleId, emailVerified, password, firstName, lastName, } = data;
            const hashedPassword = yield this.hashing(password);
            return this.userRepository.create({
                email,
                role,
                googleId,
                firstName,
                lastName,
                emailVerified,
                password: hashedPassword,
            });
        });
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.userRepository.findById(id);
        });
    }
    hashing(password) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield bcrypt_1.default.hash(password, 10);
        });
    }
    getUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.userRepository.findByEmail(email);
        });
    }
    getAllUsers() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10) {
            const skip = (page - 1) * limit;
            const users = yield this.userRepository.findAll(skip, limit);
            const total = yield this.userRepository.count();
            return {
                users,
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            };
        });
    }
    updateUser(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.userRepository.update(id, data);
        });
    }
    updateUserPassword(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.update(id, Object.assign(Object.assign({}, data), { passwordHash: yield this.hashing(data.password) }));
        });
    }
    deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.userRepository.delete(id);
        });
    }
    generateSecurePassword() {
        const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lower = 'abcdefghjkmnpqrstuvwxyz';
        const digits = '23456789';
        const special = '@#$%&*!';
        const all = upper + lower + digits + special;
        // Guarantee at least one of each character class
        const pick = (chars) => chars[(0, node_crypto_1.randomBytes)(1)[0] % chars.length];
        const required = [pick(upper), pick(lower), pick(digits), pick(special)];
        const rest = Array.from({ length: 8 }, () => pick(all));
        const combined = [...required, ...rest];
        // Fisher-Yates shuffle using crypto random values
        for (let i = combined.length - 1; i > 0; i--) {
            const j = (0, node_crypto_1.randomBytes)(1)[0] % (i + 1);
            [combined[i], combined[j]] = [combined[j], combined[i]];
        }
        return combined.join('');
    }
    adminCreateUser(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const existing = yield this.userRepository.findByEmail(data.email);
            if (existing) {
                throw ApiError_1.ApiError.conflict('A user with this email already exists');
            }
            const password = this.generateSecurePassword();
            const passwordHash = yield this.hashing(password);
            const { randomUUID } = yield Promise.resolve().then(() => __importStar(require('node:crypto')));
            const user = yield db_1.default.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    phone: data.phone,
                    role: (_a = data.role) !== null && _a !== void 0 ? _a : enums_1.UserRole.BUYER,
                    emailVerified: true,
                    googleId: `local_${randomUUID()}`,
                    appleId: `local_${randomUUID()}`,
                    profile: {
                        create: {
                            firstName: data.firstName,
                            lastName: data.lastName,
                        },
                    },
                },
                include: { profile: true },
            });
            // Invalidate any old password-reset tokens then create a fresh one
            yield db_1.default.token.updateMany({
                where: { email: data.email, type: client_1.TokenType.PASSWORD_RESET, used: false },
                data: { used: true, usedAt: new Date() },
            });
            const { randomInt } = yield Promise.resolve().then(() => __importStar(require('node:crypto')));
            const resetToken = randomInt(100000, 1000000);
            yield db_1.default.token.create({
                data: { email: data.email, token: resetToken, type: client_1.TokenType.PASSWORD_RESET },
            });
            return { user, password, resetToken };
        });
    }
    getUserByGoogleId(googleId) {
        return this.userRepository.findByGoogleId(googleId);
    }
    findById(id) {
        return this.userRepository.findById(id);
    }
    updateUserInfo(userId, data) {
        return this.userRepository.updateUserInfo(userId, data);
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.UserRepository)),
    __metadata("design:paramtypes", [UserRepository_1.UserRepository])
], UserService);
