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
exports.TrendingService = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const OrderRepository_1 = require("../repositories/OrderRepository");
const VehicleRepository_1 = require("../repositories/VehicleRepository");
const TrendingDefinitionRepository_1 = require("../repositories/TrendingDefinitionRepository");
const AutoDevService_1 = require("../services/AutoDevService");
const RedisCacheService_1 = require("../services/RedisCacheService");
const vehicle_transformer_1 = require("../helpers/vehicle-transformer");
const loggers_1 = __importDefault(require("../utils/loggers"));
const MAX_ORDERED_VEHICLES = 15;
let TrendingService = class TrendingService {
    constructor(orderRepo, vehicleRepo, trendingRepo, autoDevService, redisCache) {
        this.orderRepo = orderRepo;
        this.vehicleRepo = vehicleRepo;
        this.trendingRepo = trendingRepo;
        this.autoDevService = autoDevService;
        this.redisCache = redisCache;
    }
    /**
     * Get trending vehicles for the home "Featured Vehicles" rail:
     * (0) DB listings with featured=true (admin/seller, within optional featuredUntil),
     * (1) vehicles people ordered (any marketplace-visible source),
     * (2) up to maxFetchCount per trending rule from Auto.dev.
     */
    getTrendingVehicles() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const result = [];
            const seenVins = new Set();
            const pushByVin = (v) => {
                if (!v.vin || seenVins.has(v.vin))
                    return;
                seenVins.add(v.vin);
                result.push(v);
            };
            // 0. DB featured first (admin/manual + approved seller listings with featured=true)
            try {
                const featured = yield this.vehicleRepo.findFeaturedForHomeTrending(24);
                for (const v of featured)
                    pushByVin(v);
            }
            catch (e) {
                loggers_1.default.warn('TrendingService: failed to load featured vehicles', e);
            }
            // 1. Vehicles from orders (most ordered first) — any marketplace-visible source
            try {
                const orderedVehicleIds = yield this.orderRepo.findOrderedVehicleIds(MAX_ORDERED_VEHICLES);
                const orderedVehicles = yield this.vehicleRepo.findManyByIds(orderedVehicleIds);
                for (const v of orderedVehicles) {
                    pushByVin(v);
                }
            }
            catch (e) {
                loggers_1.default.warn('TrendingService: failed to load ordered vehicles', e);
            }
            // 2. Curated: up to maxFetchCount per trending definition from Auto.dev
            const definitions = yield this.trendingRepo.findManyActive();
            for (const def of definitions) {
                try {
                    const params = {
                        'vehicle.make': def.make,
                        'vehicle.year': `${def.yearStart}-${def.yearEnd}`,
                        limit: def.maxFetchCount,
                    };
                    if ((_a = def.model) === null || _a === void 0 ? void 0 : _a.trim())
                        params['vehicle.model'] = def.model.trim();
                    const listings = yield this.autoDevService.fetchListingsWithParams(params);
                    for (const listing of listings) {
                        const vin = listing.vin || ((_b = listing.vehicle) === null || _b === void 0 ? void 0 : _b.vin);
                        if (vin && !seenVins.has(vin)) {
                            seenVins.add(vin);
                            const vehicleData = vehicle_transformer_1.VehicleTransformer.fromAutoDevListing(listing, []);
                            vehicleData.apiData = { listing, raw: listing, isTemporary: true };
                            vehicleData.apiSyncStatus = 'PENDING';
                            vehicleData.id = yield this.redisCache.registerTempVehiclePublicId(vin);
                            result.push(vehicleData);
                        }
                    }
                }
                catch (e) {
                    loggers_1.default.warn(`TrendingService: failed for rule ${def.make} ${def.model || ''} ${def.yearStart}-${def.yearEnd}`, e);
                }
            }
            return result;
        });
    }
    getMaxFetchCount() {
        return __awaiter(this, void 0, void 0, function* () {
            const defs = yield this.trendingRepo.findManyActive();
            if (!defs.length)
                return 1;
            const values = defs
                .map((d) => (typeof d.maxFetchCount === 'number' && d.maxFetchCount > 0 ? d.maxFetchCount : 1));
            return values.length ? Math.max(...values) : 1;
        });
    }
};
exports.TrendingService = TrendingService;
exports.TrendingService = TrendingService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.OrderRepository)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.VehicleRepository)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.TrendingDefinitionRepository)),
    __param(3, (0, inversify_1.inject)(types_1.TYPES.AutoDevService)),
    __param(4, (0, inversify_1.inject)(types_1.TYPES.RedisCacheService)),
    __metadata("design:paramtypes", [OrderRepository_1.OrderRepository,
        VehicleRepository_1.VehicleRepository,
        TrendingDefinitionRepository_1.TrendingDefinitionRepository,
        AutoDevService_1.AutoDevService,
        RedisCacheService_1.RedisCacheService])
], TrendingService);
