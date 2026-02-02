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
exports.VehicleRepository = void 0;
const inversify_1 = require("inversify");
const db_1 = __importDefault(require("../db"));
let VehicleRepository = class VehicleRepository {
    /**
     * Create a new vehicle
     */
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.vehicle.create({ data });
        });
    }
    /**
     * Find vehicle by ID
     */
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.vehicle.findUnique({
                where: { id },
                include: {
                    orders: {
                        take: 5,
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
        });
    }
    /**
     * Find vehicle by VIN
     */
    findByVIN(vin) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.vehicle.findUnique({ where: { vin } });
        });
    }
    /**
     * Find which VINs already exist in DB (batch, single query)
     */
    findExistingVINs(vins) {
        return __awaiter(this, void 0, void 0, function* () {
            if (vins.length === 0)
                return new Set();
            const rows = yield db_1.default.vehicle.findMany({
                where: { vin: { in: vins } },
                select: { vin: true },
            });
            return new Set(rows.map((r) => r.vin));
        });
    }
    /**
     * Find vehicle by slug
     */
    findBySlug(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.vehicle.findUnique({ where: { slug } });
        });
    }
    /**
     * Find vehicles with filters and pagination
     */
    findMany(filters_1) {
        return __awaiter(this, arguments, void 0, function* (filters, pagination = {}) {
            const page = pagination.page || 1;
            const limit = Math.min(pagination.limit || 50, 100); // Max 100 per page
            const skip = (page - 1) * limit;
            const where = {
                isActive: filters.isActive !== false,
                isHidden: filters.isHidden !== true,
            };
            if (filters.make)
                where.make = { equals: filters.make, mode: 'insensitive' };
            if (filters.model)
                where.model = { equals: filters.model, mode: 'insensitive' };
            if (filters.vehicleType)
                where.vehicleType = filters.vehicleType;
            if (filters.status)
                where.status = filters.status;
            if (filters.source)
                where.source = filters.source;
            if (filters.dealerState)
                where.dealerState = filters.dealerState;
            if (filters.featured !== undefined)
                where.featured = filters.featured;
            if (filters.yearMin || filters.yearMax) {
                where.year = {};
                if (filters.yearMin)
                    where.year.gte = filters.yearMin;
                if (filters.yearMax)
                    where.year.lte = filters.yearMax;
            }
            if (filters.priceMin || filters.priceMax) {
                where.priceUsd = {};
                if (filters.priceMin)
                    where.priceUsd.gte = filters.priceMin;
                if (filters.priceMax)
                    where.priceUsd.lte = filters.priceMax;
            }
            if (filters.mileageMax) {
                where.mileage = { lte: filters.mileageMax };
            }
            // Search filter: only search model and VIN (not make)
            // Make should be filtered explicitly, not searched
            if (filters.search) {
                const searchConditions = [];
                const searchTerm = filters.search.trim();
                const isFullVIN = searchTerm.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/i.test(searchTerm);
                // Search model (if not already filtered)
                if (!filters.model) {
                    searchConditions.push({ model: { contains: searchTerm, mode: 'insensitive' } });
                }
                // VIN search: full VIN (exact match) or partial VIN (if make/model are filtered for context)
                if (isFullVIN) {
                    // Full VIN - exact match
                    searchConditions.push({ vin: { equals: searchTerm.toUpperCase() } });
                }
                else if (filters.make || filters.model) {
                    // Partial VIN search only when make/model are filtered (more specific context)
                    searchConditions.push({ vin: { contains: searchTerm, mode: 'insensitive' } });
                }
                if (searchConditions.length > 0) {
                    where.OR = searchConditions;
                }
            }
            const [vehicles, total] = yield Promise.all([
                db_1.default.vehicle.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: [
                        { featured: 'desc' },
                        { createdAt: 'desc' },
                    ],
                }),
                db_1.default.vehicle.count({ where }),
            ]);
            return { vehicles, total };
        });
    }
    /**
     * Update vehicle
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
     * Increment view count
     */
    incrementViewCount(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.vehicle.update({
                where: { id },
                data: { viewCount: { increment: 1 } },
            });
        });
    }
    /**
     * Increment save count
     */
    incrementSaveCount(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.vehicle.update({
                where: { id },
                data: { saveCount: { increment: 1 } },
            });
        });
    }
    /**
     * Increment request count
     */
    incrementRequestCount(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.vehicle.update({
                where: { id },
                data: { requestCount: { increment: 1 } },
            });
        });
    }
    /**
     * Delete vehicle (soft delete by setting isActive = false)
     */
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.vehicle.update({
                where: { id },
                data: { isActive: false, isHidden: true },
            });
        });
    }
};
exports.VehicleRepository = VehicleRepository;
exports.VehicleRepository = VehicleRepository = __decorate([
    (0, inversify_1.injectable)()
], VehicleRepository);
