"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
exports.UserRepository = void 0;
const inversify_1 = require("inversify");
const db_1 = __importDefault(require("../db"));
let UserRepository = class UserRepository {
    constructor() {
        this.prisma = db_1.default;
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.user.create({
                data,
                include: {
                    profile: {
                        include: { files: true },
                    },
                },
            });
        });
    }
    createUser(userData, profileData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            return this.prisma.user.create({
                data: {
                    email: userData.email,
                    googleId: userData.googleId,
                    role: userData.role,
                    emailVerified: (_a = userData.verified) !== null && _a !== void 0 ? _a : false,
                    passwordHash: userData.password,
                    profile: profileData
                        ? {
                            create: {
                                lastName: profileData.lastName,
                                firstName: profileData.firstName,
                                files: profileData.photo
                                    ? {
                                        createMany: {
                                            data: profileData.photo,
                                        },
                                    }
                                    : undefined,
                            },
                        }
                        : undefined,
                },
                include: {
                    profile: {
                        include: { files: true },
                    },
                },
            });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.user.findUnique({
                where: { id },
                include: {
                    profile: {
                        include: {
                            files: true,
                        },
                    },
                },
            });
        });
    }
    findByGoogleId(googleId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.user.findFirst({
                where: {
                    googleId,
                    isDeleted: false,
                },
                include: {
                    profile: {
                        include: { files: true },
                    },
                },
            });
        });
    }
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.user.findUnique({
                where: { email },
                include: {
                    profile: {
                        include: { files: true },
                    },
                },
            });
        });
    }
    findAll() {
        return __awaiter(this, arguments, void 0, function* (skip = 0, take = 10) {
            return this.prisma.user.findMany({
                where: { isDeleted: false },
                include: { profile: true },
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            });
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.user.update({
                where: { id },
                data,
                include: {
                    profile: {
                        include: { files: true },
                    },
                },
            });
        });
    }
    updateUserInfo(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.user.update({
                where: { id: userId },
                data: Object.assign(Object.assign({}, (data.googleId !== undefined && { googleId: data.googleId })), (data.verified !== undefined && { emailVerified: data.verified })),
                include: {
                    profile: true,
                },
            });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.user.update({
                where: { id },
                data: { isDeleted: true },
            });
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.user.count({
                where: { isDeleted: false },
            });
        });
    }
};
exports.UserRepository = UserRepository;
exports.UserRepository = UserRepository = __decorate([
    (0, inversify_1.injectable)()
], UserRepository);
