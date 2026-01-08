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
exports.ProfileRepository = void 0;
const inversify_1 = require("inversify");
const db_1 = __importDefault(require("../db"));
const ApiError_1 = require("../utils/ApiError");
let ProfileRepository = class ProfileRepository {
    /* -----------------------------------------------------
       CREATE / UPSERT PROFILE
    ----------------------------------------------------- */
    create(data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield db_1.default.profile.upsert({
                    where: { userId },
                    update: Object.assign({}, data),
                    create: Object.assign(Object.assign({}, data), { userId }),
                });
            }
            catch (error) {
                throw ApiError_1.ApiError.internal(`Failed to create profile: ${error.message}`);
            }
        });
    }
    /* -----------------------------------------------------
       FIND BY PROFILE ID
    ----------------------------------------------------- */
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.profile.findUnique({
                where: { id },
            });
        });
    }
    /* -----------------------------------------------------
       FIND BY USER ID (WITH USER INFO)
    ----------------------------------------------------- */
    findUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.profile.findUnique({
                where: { userId },
                include: {
                    user: {
                        select: {
                            email: true,
                            phone: true,
                        },
                    },
                },
            });
        });
    }
    /* -----------------------------------------------------
       UPDATE PROFILE BY USER ID
    ----------------------------------------------------- */
    updateProfileByUserId(userId, update) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.profile.upsert({
                where: { userId },
                create: Object.assign({ userId }, update),
                update: update,
            });
        });
    }
    /* -----------------------------------------------------
       UPDATE PROFILE (BY PROFILE ID)
    ----------------------------------------------------- */
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.profile.update({
                where: { id },
                data,
            });
        });
    }
    /* -----------------------------------------------------
       FIND ALL PROFILES
    ----------------------------------------------------- */
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.profile.findMany({
                orderBy: { createdAt: 'desc' },
            });
        });
    }
    /* -----------------------------------------------------
       SEARCH PROFILES BY NAME
    ----------------------------------------------------- */
    searchProfilesByName(firstName, lastName, excludeUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!firstName && !lastName) {
                throw ApiError_1.ApiError.badRequest('Either firstName or lastName must be provided');
            }
            return db_1.default.profile.findMany({
                where: {
                    AND: [
                        excludeUserId
                            ? { userId: { not: excludeUserId } }
                            : {},
                        firstName
                            ? {
                                firstName: {
                                    contains: firstName,
                                    mode: 'insensitive',
                                },
                            }
                            : {},
                        lastName
                            ? {
                                lastName: {
                                    contains: lastName,
                                    mode: 'insensitive',
                                },
                            }
                            : {},
                    ],
                },
                include: {
                    user: {
                        select: {
                            email: true,
                            phone: true,
                            role: true,
                            isActive: true,
                        },
                    },
                },
                take: 50,
            });
        });
    }
    /* -----------------------------------------------------
     FIND ALL PROFILES
  ----------------------------------------------------- */
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.profile.delete({
                where: { id },
            });
        });
    }
};
exports.ProfileRepository = ProfileRepository;
exports.ProfileRepository = ProfileRepository = __decorate([
    (0, inversify_1.injectable)()
], ProfileRepository);
