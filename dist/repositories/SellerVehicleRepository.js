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
exports.SellerVehicleRepository = void 0;
const inversify_1 = require("inversify");
const db_1 = __importDefault(require("../db"));
const client_1 = require("../generated/prisma/client");
let SellerVehicleRepository = class SellerVehicleRepository {
    /**
     * Create a new seller listing
     */
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.vehicle.create({
                data: Object.assign(Object.assign({}, data), { source: client_1.VehicleSource.SELLER })
            });
        });
    }
    /**
     * Find listing by ID
     */
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.vehicle.findUnique({
                where: { id },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                            phone: true,
                        },
                    },
                },
            });
        });
    }
    /**
     * Find listings with filters and pagination
     */
    findMany(filters_1) {
        return __awaiter(this, arguments, void 0, function* (filters, pagination = {}) {
            const page = pagination.page || 1;
            const limit = Math.min(pagination.limit || 50, 100);
            const skip = (page - 1) * limit;
            const where = {
                source: client_1.VehicleSource.SELLER
            };
            if (filters.status)
                where.status = filters.status;
            if (filters.userId)
                where.userId = filters.userId;
            if (filters.make)
                where.make = { equals: filters.make, mode: 'insensitive' };
            if (filters.model)
                where.model = { equals: filters.model, mode: 'insensitive' };
            if (filters.year)
                where.year = filters.year;
            const [listings, total] = yield Promise.all([
                db_1.default.vehicle.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                fullName: true,
                            },
                        },
                    },
                }),
                db_1.default.vehicle.count({ where }),
            ]);
            return { listings, total };
        });
    }
    /**
     * Update listing
     */
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.vehicle.update({
                where: { id },
                data,
            });
        });
    }
    /**
     * Delete listing
     */
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.vehicle.delete({
                where: { id },
            });
        });
    }
};
exports.SellerVehicleRepository = SellerVehicleRepository;
exports.SellerVehicleRepository = SellerVehicleRepository = __decorate([
    (0, inversify_1.injectable)()
], SellerVehicleRepository);
