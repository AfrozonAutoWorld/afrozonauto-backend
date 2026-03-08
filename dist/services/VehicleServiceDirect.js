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
var VehicleServiceDirect_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleServiceDirect = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const VehicleRepository_1 = require("../repositories/VehicleRepository");
const SavedVehicleRepository_1 = require("../repositories/SavedVehicleRepository");
const AutoDevService_1 = require("./AutoDevService");
const TrendingService_1 = require("./TrendingService");
const RecommendedService_1 = require("./RecommendedService");
const CategoryService_1 = require("./CategoryService");
const vehicle_transformer_1 = require("../helpers/vehicle-transformer");
const vehicleLogs_1 = require("../helpers/vehicleLogs");
const client_1 = require("../generated/prisma/client");
const ApiError_1 = require("../utils/ApiError");
const loggers_1 = __importDefault(require("../utils/loggers"));
let VehicleServiceDirect = VehicleServiceDirect_1 = class VehicleServiceDirect {
    constructor(vehicleRepo, savedVehicleRepo, autoDevService, trendingService, recommendedService, categoryService) {
        this.vehicleRepo = vehicleRepo;
        this.savedVehicleRepo = savedVehicleRepo;
        this.autoDevService = autoDevService;
        this.trendingService = trendingService;
        this.recommendedService = recommendedService;
        this.categoryService = categoryService;
        this.cacheTTLHours = parseInt(process.env.REDIS_CACHE_TTL_HOURS || '12', 10);
    }
    getTrendingVehicles() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.trendingService.getTrendingVehicles();
        });
    }
    /**
     * Get vehicles for "Recommended for you":
     * (1) If userId: prepend vehicles the user saved ("You saved this").
     * (2) Primary: fetch from Auto.dev per RecommendedDefinition (like Trending), with reason per definition.
     * (3) Secondary: DB vehicles with recommended=true (recommendationReason or default).
     * Dedupe by id/VIN, slice to limit.
     */
    getRecommendedVehicles() {
        return __awaiter(this, arguments, void 0, function* (limit = 12, userId) {
            const seen = new Set();
            const result = [];
            const keyOf = (v) => v.id || (v.vin ? `vin-${v.vin}` : '');
            // (1) Logged-in: prepend saved vehicles
            if (userId) {
                const savedIds = yield this.savedVehicleRepo.findVehicleIdsByUserId(userId, 6);
                if (savedIds.length > 0) {
                    const savedVehicles = yield this.vehicleRepo.findManyByIds(savedIds);
                    for (const v of savedVehicles) {
                        const k = keyOf(v);
                        if (k && !seen.has(k)) {
                            seen.add(k);
                            result.push({ vehicle: v, reason: 'You saved this' });
                        }
                    }
                }
            }
            // (2) Primary: from Auto.dev per RecommendedDefinition (recommended rail)
            const fromDefinitions = yield this.recommendedService.getFromDefinitions(limit, 'recommended');
            for (const { vehicle, reason } of fromDefinitions) {
                const k = keyOf(vehicle);
                if (k && !seen.has(k)) {
                    seen.add(k);
                    result.push({ vehicle, reason });
                }
                if (result.length >= limit)
                    return result.slice(0, limit);
            }
            // (3) Secondary: DB-flagged recommended
            const dbRecommended = yield this.vehicleRepo.findRecommended(limit);
            const getDbReason = (v) => { var _a; return ((_a = v.recommendationReason) === null || _a === void 0 ? void 0 : _a.trim()) || VehicleServiceDirect_1.DEFAULT_RECOMMENDATION_REASON; };
            for (const v of dbRecommended) {
                const k = keyOf(v);
                if (k && !seen.has(k)) {
                    seen.add(k);
                    result.push({ vehicle: v, reason: getDbReason(v) });
                }
                if (result.length >= limit)
                    return result.slice(0, limit);
            }
            return result.slice(0, limit);
        });
    }
    /**
     * Get vehicles for "Specialty Vehicles" rail:
     * (1) Primary: from Auto.dev per RecommendedDefinition with forSpecialty=true.
     * (2) Secondary: DB vehicles with specialty=true.
     * Dedupe by id/VIN, slice to limit.
     */
    getSpecialtyVehicles() {
        return __awaiter(this, arguments, void 0, function* (limit = 12) {
            const seen = new Set();
            const result = [];
            const keyOf = (v) => v.id || (v.vin ? `vin-${v.vin}` : '');
            // (1) From Auto.dev definitions tagged for specialty
            const fromDefinitions = yield this.recommendedService.getFromDefinitions(limit, 'specialty');
            for (const { vehicle, reason } of fromDefinitions) {
                const k = keyOf(vehicle);
                if (k && !seen.has(k)) {
                    seen.add(k);
                    result.push({ vehicle, reason });
                }
                if (result.length >= limit)
                    return result.slice(0, limit);
            }
            // (2) DB-flagged specialty
            const dbSpecialty = yield this.vehicleRepo.findSpecialty(limit);
            for (const v of dbSpecialty) {
                const k = keyOf(v);
                if (k && !seen.has(k)) {
                    seen.add(k);
                    result.push({ vehicle: v, reason: 'Specialty vehicle' });
                }
                if (result.length >= limit)
                    return result.slice(0, limit);
            }
            return result.slice(0, limit);
        });
    }
    getMakeModelsReference() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.autoDevService.fetchMakeModelsReference();
        });
    }
    /**
     * Use to inspect what Auto.dev returns on e.g. page 4 and avoid Hummer/truck dominance.
     */
    getAutoDevPageSummary() {
        return __awaiter(this, arguments, void 0, function* (page = 4, limit = 24) {
            var _a, _b;
            const params = { page, limit };
            const apiListings = yield this.autoDevService.fetchListingsWithParams(params);
            const byMake = {};
            const byMakeModel = {};
            const sample = [];
            for (const listing of apiListings) {
                const v = listing.vehicle || listing;
                const make = (v.make || '').toString().trim() || 'Unknown';
                const model = (v.model || '').toString().trim() || 'Unknown';
                const year = typeof v.year === 'number' ? v.year : undefined;
                byMake[make] = ((_a = byMake[make]) !== null && _a !== void 0 ? _a : 0) + 1;
                if (!byMakeModel[make])
                    byMakeModel[make] = {};
                byMakeModel[make][model] = ((_b = byMakeModel[make][model]) !== null && _b !== void 0 ? _b : 0) + 1;
                if (sample.length < 15)
                    sample.push({ make, model, year });
            }
            return { page, limit, count: apiListings.length, byMake, byMakeModel, sample };
        });
    }
    filtersToAutoDevParams(filters, page, limit) {
        var _a, _b, _c, _d, _e;
        const params = {};
        if (page != null && page >= 1)
            params.page = page;
        if (limit != null && limit >= 1)
            params.limit = Math.min(limit, 100);
        if (filters.make)
            params['vehicle.make'] = filters.make;
        if (filters.model)
            params['vehicle.model'] = filters.model;
        if (filters.yearMin != null && filters.yearMax != null && filters.yearMin === filters.yearMax) {
            params['vehicle.year'] = String(filters.yearMin);
        }
        else if (filters.yearMin != null || filters.yearMax != null) {
            const min = (_a = filters.yearMin) !== null && _a !== void 0 ? _a : 0;
            const max = (_b = filters.yearMax) !== null && _b !== void 0 ? _b : new Date().getFullYear() + 1;
            params['vehicle.year'] = `${min}-${max}`;
        }
        if (filters.priceMin != null || filters.priceMax != null) {
            const min = (_c = filters.priceMin) !== null && _c !== void 0 ? _c : 0;
            const max = (_d = filters.priceMax) !== null && _d !== void 0 ? _d : 99999999;
            params['retailListing.price'] = `${min}-${max}`;
        }
        if (filters.mileageMax != null) {
            params['retailListing.miles'] = `0-${filters.mileageMax}`;
        }
        if (filters.dealerState) {
            params['retailListing.state'] = filters.dealerState;
        }
        if (filters.vehicleType) {
            const bodyStyle = vehicle_transformer_1.VehicleTransformer.vehicleTypeToBodyStyle(filters.vehicleType);
            if (bodyStyle)
                params['vehicle.bodyStyle'] = bodyStyle;
        }
        if (filters.bodyStyle)
            params['vehicle.bodyStyle'] = filters.bodyStyle;
        if (filters.fuel)
            params['vehicle.fuel'] = filters.fuel;
        if (filters.transmission)
            params['vehicle.transmission'] = filters.transmission;
        if (filters.exteriorColor)
            params['vehicle.exteriorColor'] = filters.exteriorColor;
        if (filters.interiorColor)
            params['vehicle.interiorColor'] = filters.interiorColor;
        if (filters.zip)
            params.zip = filters.zip;
        if (filters.distance != null && filters.distance > 0)
            params.distance = filters.distance;
        if (filters.condition === 'used') {
            params['retailListing.used'] = 'true';
        }
        else if (filters.condition === 'cpo') {
            params['retailListing.cpo'] = 'true';
        }
        else if (filters.condition === 'new') {
            params['retailListing.used'] = 'false';
        }
        if (filters.drivetrain)
            params['vehicle.drivetrain'] = filters.drivetrain;
        if ((_e = filters.luxuryMakes) === null || _e === void 0 ? void 0 : _e.length)
            params['vehicle.make'] = filters.luxuryMakes.join(',');
        return params;
    }
    isPriceStale(vehicle) {
        if (!vehicle.lastApiSync || vehicle.source !== client_1.VehicleSource.API)
            return false;
        const now = new Date();
        const lastSync = new Date(vehicle.lastApiSync);
        const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
        return hoursSinceSync >= this.cacheTTLHours;
    }
    refreshVehiclePrice(vehicle) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            if (!vehicle.vin || !this.isPriceStale(vehicle))
                return null;
            const oldPrice = vehicle.priceUsd;
            const lastSync = vehicle.lastApiSync ? new Date(vehicle.lastApiSync).toISOString() : 'never';
            const hoursStale = vehicle.lastApiSync
                ? ((new Date().getTime() - new Date(vehicle.lastApiSync).getTime()) / (1000 * 60 * 60)).toFixed(1)
                : 'unknown';
            try {
                const listing = yield this.autoDevService.fetchListingByVIN(vehicle.vin);
                const retailListing = (_a = listing === null || listing === void 0 ? void 0 : listing.retailListing) !== null && _a !== void 0 ? _a : listing;
                const newPrice = (_c = (_b = retailListing === null || retailListing === void 0 ? void 0 : retailListing.price) !== null && _b !== void 0 ? _b : listing === null || listing === void 0 ? void 0 : listing.price) !== null && _c !== void 0 ? _c : 0;
                if (!listing || !newPrice)
                    return null;
                const priceDiff = newPrice - oldPrice;
                const priceDiffPercent = ((priceDiff / oldPrice) * 100).toFixed(2);
                const priceChangeDirection = priceDiff > 0 ? 'INCREASE' : priceDiff < 0 ? 'DECREASE' : 'NO_CHANGE';
                if (Math.abs(priceDiff) > 0.01) {
                    const priceHistory = Array.isArray(vehicle.priceHistory) ? [...vehicle.priceHistory] : [];
                    priceHistory.push({
                        date: new Date().toISOString(),
                        price: newPrice,
                        previousPrice: oldPrice,
                        priceChange: priceDiff,
                        priceChangePercent: parseFloat(priceDiffPercent),
                        reason: 'API_PRICE_UPDATE',
                        source: 'autodev',
                        dataSource: 'api',
                    });
                    const updateData = {
                        priceUsd: newPrice,
                        priceHistory: priceHistory,
                        lastApiSync: new Date(),
                        apiSyncStatus: 'SYNCED',
                        apiSyncError: null,
                        apiData: Object.assign(Object.assign({}, (vehicle.apiData || {})), { listing, raw: listing, syncedAt: new Date().toISOString() }),
                    };
                    const updated = yield this.vehicleRepo.update(vehicle.id, updateData);
                    yield vehicleLogs_1.VehicleLogs.logPriceUpdate(vehicle, {
                        vin: vehicle.vin,
                        make: vehicle.make,
                        model: vehicle.model,
                        year: vehicle.year,
                        oldPrice,
                        newPrice,
                        priceChange: priceDiff,
                        priceChangePercent: parseFloat(priceDiffPercent),
                        direction: priceChangeDirection,
                        dataSource: 'api',
                        lastSync: (_d = vehicle.lastApiSync) === null || _d === void 0 ? void 0 : _d.toISOString(),
                        hoursStale,
                        priceHistoryCount: priceHistory.length,
                    });
                    return updated;
                }
                yield this.vehicleRepo.update(vehicle.id, {
                    lastApiSync: new Date(),
                    apiSyncStatus: 'SYNCED',
                });
                yield vehicleLogs_1.VehicleLogs.logPriceRefresh(vehicle, {
                    vin: vehicle.vin,
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year,
                    price: oldPrice,
                    dataSource: 'api',
                    lastSync: (_e = vehicle.lastApiSync) === null || _e === void 0 ? void 0 : _e.toISOString(),
                    hoursStale,
                    status: 'unchanged',
                });
                return null;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                yield this.vehicleRepo.update(vehicle.id, {
                    apiSyncStatus: 'OUTDATED',
                    apiSyncError: errorMessage,
                }).catch(() => { });
                yield vehicleLogs_1.VehicleLogs.logPriceRefreshFailed(vehicle, {
                    vin: vehicle.vin,
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year,
                    currentPrice: oldPrice,
                    error: errorMessage,
                    lastSync: (_f = vehicle.lastApiSync) === null || _f === void 0 ? void 0 : _f.toISOString(),
                    hoursStale,
                    status: 'failed',
                });
                return null;
            }
        });
    }
    sortVehiclesInPlace(vehicles, sortBy, sortOrder = 'asc', demoteHummers = false) {
        if (!sortBy || vehicles.length === 0)
            return;
        let key;
        switch (sortBy) {
            case 'price':
            case 'priceUsd':
                key = 'priceUsd';
                break;
            case 'year':
                key = 'year';
                break;
            case 'mileage':
                key = 'mileage';
                break;
            case 'createdAt':
            default:
                key = 'createdAt';
                break;
        }
        const isHummer = (v) => {
            const make = (v.make || '').toLowerCase();
            const model = (v.model || '').toLowerCase();
            return make.includes('hummer') || model.includes('hummer');
        };
        vehicles.sort((a, b) => {
            var _a, _b, _c, _d;
            if (demoteHummers) {
                const aH = isHummer(a);
                const bH = isHummer(b);
                if (aH !== bH) {
                    // Non‑Hummers first, Hummers after
                    return aH ? 1 : -1;
                }
            }
            const aVal = key === 'createdAt'
                ? ((_a = a.createdAt) !== null && _a !== void 0 ? _a : new Date(0)).getTime()
                : ((_b = a[key]) !== null && _b !== void 0 ? _b : 0);
            const bVal = key === 'createdAt'
                ? ((_c = b.createdAt) !== null && _c !== void 0 ? _c : new Date(0)).getTime()
                : ((_d = b[key]) !== null && _d !== void 0 ? _d : 0);
            if (aVal === bVal)
                return 0;
            return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
        });
    }
    getVehicles(filters_1) {
        return __awaiter(this, arguments, void 0, function* (filters, pagination = {}, includeApiResults = true, categorySlug, sortBy, sortOrder = 'asc') {
            var _a, _b;
            const page = pagination.page || 1;
            const limit = pagination.limit || 50;
            let resolvedFilters = filters;
            if (categorySlug) {
                const category = yield this.categoryService.getBySlug(categorySlug);
                if (category) {
                    resolvedFilters = Object.assign({}, filters);
                    if (category.bodyStyle) {
                        resolvedFilters.bodyStyle = category.bodyStyle;
                        resolvedFilters.vehicleType = vehicle_transformer_1.VehicleTransformer.mapVehicleType(category.bodyStyle);
                    }
                    if (category.fuel)
                        resolvedFilters.fuel = category.fuel;
                    if ((_a = category.luxuryMakes) === null || _a === void 0 ? void 0 : _a.length)
                        resolvedFilters.luxuryMakes = category.luxuryMakes;
                    if (category.priceMin != null)
                        resolvedFilters.priceMin = category.priceMin;
                }
            }
            const dbResult = yield this.vehicleRepo.findMany(resolvedFilters, pagination);
            const staleVehicles = dbResult.vehicles.filter((v) => this.isPriceStale(v));
            Promise.all(staleVehicles.map((v) => this.refreshVehiclePrice(v).catch(() => null))).catch(() => { });
            let apiVehicles = [];
            let fromApiCount = 0; // how many API listings made it into the response (after de-dup and price filter)
            let apiRawCount = 0; // how many the API actually returned (before our filtering)
            let apiOnlyCount = 0;
            if (includeApiResults) {
                try {
                    // Where to start on Auto.dev: no filters → page 5 (avoid Hummer-heavy 1–4); with filters → page 1.
                    const isBrowsingAll = !resolvedFilters.make &&
                        !resolvedFilters.model &&
                        !resolvedFilters.search &&
                        !resolvedFilters.vehicleType &&
                        !categorySlug;
                    const apiPageBase = isBrowsingAll ? 5 : 1;
                    const apiPage = apiPageBase + (page - 1);
                    const apiLimit = limit;
                    const apiParams = this.filtersToAutoDevParams(resolvedFilters, apiPage, apiLimit);
                    const apiListings = yield this.autoDevService.fetchListingsWithParams(apiParams);
                    apiRawCount = apiListings.length;
                    let filteredListings = apiListings;
                    if ((_b = filters.search) === null || _b === void 0 ? void 0 : _b.trim()) {
                        const searchTerm = filters.search.trim().toLowerCase();
                        const isFullVIN = searchTerm.length === 17 && /^[a-hj-npr-z0-9]{17}$/i.test(searchTerm);
                        filteredListings = apiListings.filter((listing) => {
                            const vehicle = listing.vehicle || listing;
                            const model = (vehicle.model || listing.model || '').toLowerCase();
                            const vin = (listing.vin || vehicle.vin || '').toUpperCase();
                            if (isFullVIN && vin === searchTerm.toUpperCase())
                                return true;
                            if (!filters.model && model.includes(searchTerm))
                                return true;
                            if (vin.includes(searchTerm.toUpperCase()))
                                return true;
                            return false;
                        });
                    }
                    const vinsToCheck = filteredListings.map((l) => l.vin).filter(Boolean);
                    const existingVins = yield this.vehicleRepo.findExistingVINs(vinsToCheck);
                    const apiOnlyList = filteredListings.filter((l) => l.vin && !existingVins.has(l.vin));
                    apiOnlyCount = apiOnlyList.length;
                    const needCount = limit - dbResult.vehicles.length;
                    // Take first needCount valid (de-dup done above; here we skip no/zero price and stop when we have enough).
                    for (const listing of apiOnlyList) {
                        if (apiVehicles.length >= needCount)
                            break;
                        const vehicleData = vehicle_transformer_1.VehicleTransformer.fromAutoDevListing(listing, []);
                        if (!vehicleData.priceUsd || vehicleData.priceUsd <= 0)
                            continue;
                        vehicleData.apiData = {
                            listing,
                            raw: listing,
                            isTemporary: true,
                            cached: false,
                        };
                        vehicleData.apiSyncStatus = 'PENDING';
                        vehicleData.id = `temp-${listing.vin}`;
                        apiVehicles.push(vehicleData);
                    }
                    fromApiCount = apiVehicles.length;
                }
                catch (error) {
                    loggers_1.default.warn('Failed to fetch from Auto.dev API (direct), returning DB results only:', error);
                }
            }
            const allVehicles = [...dbResult.vehicles, ...apiVehicles];
            if (sortBy) {
                const demoteHummers = !resolvedFilters.make && !resolvedFilters.vehicleType;
                this.sortVehiclesInPlace(allVehicles, sortBy, sortOrder, demoteHummers);
            }
            // We don't know total from Auto.dev; only reliable signal is full page. No total/pages when API is used.
            const usedApi = !!includeApiResults;
            const total = usedApi ? 0 : dbResult.total + apiOnlyCount;
            const pages = usedApi ? 0 : Math.ceil((dbResult.total + apiOnlyCount) / limit) || 1;
            const hasMore = allVehicles.length >= limit;
            return {
                vehicles: allVehicles,
                total,
                page,
                limit,
                pages,
                fromApi: apiRawCount,
                filteredCount: fromApiCount,
                apiUsed: !!includeApiResults,
                hasMore,
            };
        });
    }
    getVehicle(identifier_1) {
        return __awaiter(this, arguments, void 0, function* (identifier, type = 'id') {
            if (type === 'vin')
                return this.getVehicleByVIN(identifier);
            const trim = (identifier || '').trim();
            if (trim.startsWith('temp-'))
                return this.getVehicleByVIN(trim.replace(/^temp-/, ''));
            if (this.looksLikeVin(trim))
                return this.getVehicleByVIN(trim);
            if (this.isMongoObjectId(trim)) {
                let vehicle = yield this.vehicleRepo.findById(trim);
                if (vehicle && this.isPriceStale(vehicle)) {
                    const refreshed = yield this.refreshVehiclePrice(vehicle);
                    if (refreshed)
                        vehicle = refreshed;
                }
                if (vehicle) {
                    this.vehicleRepo.incrementViewCount(vehicle.id).catch((err) => loggers_1.default.error('Failed to increment view count:', err));
                    return vehicle;
                }
                throw ApiError_1.ApiError.notFound('Vehicle not found');
            }
            throw ApiError_1.ApiError.badRequest('Invalid identifier. Use a 24-character vehicle id or a 17-character VIN. For VIN use ?type=vin');
        });
    }
    getVehicleByVIN(vin) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!vin || vin.trim().length !== 17) {
                throw ApiError_1.ApiError.badRequest('Invalid VIN. Must be 17 characters');
            }
            const normalizedVin = vin.trim().toUpperCase();
            const fromDb = yield this.vehicleRepo.findByVIN(normalizedVin);
            if (fromDb) {
                let vehicle = fromDb;
                if (this.isPriceStale(vehicle)) {
                    const refreshed = yield this.refreshVehiclePrice(vehicle);
                    if (refreshed)
                        vehicle = refreshed;
                }
                this.vehicleRepo.incrementViewCount(vehicle.id).catch((err) => loggers_1.default.error('Failed to increment view count:', err));
                return vehicle;
            }
            try {
                const [listing, photos, specs] = yield Promise.all([
                    this.autoDevService.fetchListingByVIN(normalizedVin),
                    this.autoDevService.fetchPhotos(normalizedVin),
                    this.autoDevService.fetchSpecifications(normalizedVin),
                ]);
                if (listing) {
                    const vehicleData = vehicle_transformer_1.VehicleTransformer.fromAutoDevListing(listing, photos || [], specs);
                    vehicleData.apiData = {
                        listing,
                        specs,
                        photos: photos || [],
                        raw: listing,
                        isTemporary: true,
                    };
                    vehicleData.apiSyncStatus = 'PENDING';
                    vehicleData.id = `temp-${normalizedVin}`;
                    if (vehicleData.id && !vehicleData.id.startsWith('temp-')) {
                        this.vehicleRepo.incrementViewCount(vehicleData.id).catch(() => { });
                    }
                    return vehicleData;
                }
            }
            catch (error) {
                loggers_1.default.warn(`Failed to fetch vehicle ${normalizedVin} from Auto.dev (direct):`, error);
            }
            throw ApiError_1.ApiError.notFound('Vehicle not found');
        });
    }
    getVehicleByVINFromDB(vin) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.vehicleRepo.findByVIN(vin);
        });
    }
    createVehicle(dto, addedBy) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield this.vehicleRepo.findByVIN(dto.vin);
            if (existing)
                throw ApiError_1.ApiError.conflict('Vehicle with this VIN already exists');
            return this.vehicleRepo.create(Object.assign(Object.assign({}, dto), { source: dto.source || client_1.VehicleSource.MANUAL, addedBy, isActive: dto.isActive !== false, isHidden: dto.isHidden || false }));
        });
    }
    syncFromAutoDev(vin) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield this.vehicleRepo.findByVIN(vin);
            try {
                const [listing, photos, specs] = yield Promise.all([
                    this.autoDevService.fetchListingByVIN(vin),
                    this.autoDevService.fetchPhotos(vin),
                    this.autoDevService.fetchSpecifications(vin),
                ]);
                if (!listing) {
                    if (existing) {
                        yield this.vehicleRepo.update(existing.id, {
                            apiSyncStatus: 'FAILED',
                            apiSyncError: 'Vehicle not found in Auto.dev',
                        });
                    }
                    throw ApiError_1.ApiError.notFound('Vehicle not found in Auto.dev');
                }
                const vehicleData = vehicle_transformer_1.VehicleTransformer.fromAutoDevListing(listing, photos || [], specs);
                vehicleData.apiData = { listing, specs, photos: photos || [], raw: listing, syncedAt: new Date().toISOString() };
                vehicleData.lastApiSync = new Date();
                vehicleData.apiSyncStatus = 'SYNCED';
                vehicleData.apiSyncError = null;
                if (existing) {
                    return this.vehicleRepo.update(existing.id, vehicleData);
                }
                return this.vehicleRepo.create(vehicleData);
            }
            catch (error) {
                if (existing) {
                    yield this.vehicleRepo.update(existing.id, {
                        apiSyncStatus: 'FAILED',
                        apiSyncError: error.message || 'Failed to sync from Auto.dev API',
                    });
                }
                throw ApiError_1.ApiError.badGateway('Failed to sync vehicle from Auto.dev API');
            }
        });
    }
    isValidId(id) {
        return !!(id && id.trim() && !id.startsWith(':') && id !== 'null' && id !== 'undefined');
    }
    isMongoObjectId(s) {
        return /^[a-fA-F0-9]{24}$/.test((s || '').trim());
    }
    looksLikeVin(s) {
        const t = (s || '').trim();
        return t.length === 17 && /^[A-HJ-NPR-Z0-9]+$/i.test(t);
    }
    updateVehicle(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isValidId(id))
                throw ApiError_1.ApiError.badRequest('Invalid vehicle ID provided');
            if (!this.isMongoObjectId(id)) {
                throw ApiError_1.ApiError.badRequest('Vehicle ID must be a 24-character hex string (MongoDB ObjectId). This endpoint does not accept VINs.');
            }
            const existing = yield this.vehicleRepo.findById(id);
            if (!existing)
                throw ApiError_1.ApiError.notFound('Vehicle not found');
            return this.vehicleRepo.update(id, data);
        });
    }
    deleteVehicle(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isValidId(id))
                throw ApiError_1.ApiError.badRequest('Invalid vehicle ID provided');
            if (!this.isMongoObjectId(id)) {
                throw ApiError_1.ApiError.badRequest('Vehicle ID must be a 24-character hex string (MongoDB ObjectId). This endpoint does not accept VINs.');
            }
            const existing = yield this.vehicleRepo.findById(id);
            if (!existing)
                throw ApiError_1.ApiError.notFound('Vehicle not found');
            yield this.vehicleRepo.delete(id);
        });
    }
    /** Get current user's saved vehicles (for Saved tab). */
    getSavedVehicles(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.savedVehicleRepo.findSavedVehiclesByUserId(userId);
        });
    }
    /** Add vehicle to user's saved list. Vehicle must exist in DB (use save-from-api first for API listings). */
    addSavedVehicle(userId, vehicleId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isMongoObjectId(vehicleId))
                throw ApiError_1.ApiError.badRequest('Invalid vehicle ID');
            const vehicle = yield this.vehicleRepo.findById(vehicleId);
            if (!vehicle)
                throw ApiError_1.ApiError.notFound('Vehicle not found');
            const already = yield this.savedVehicleRepo.exists(userId, vehicleId);
            if (already)
                return { savedAt: new Date() };
            const row = yield this.savedVehicleRepo.create(userId, vehicleId);
            return { savedAt: row.createdAt };
        });
    }
    /** Remove vehicle from user's saved list. */
    removeSavedVehicle(userId, vehicleId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isMongoObjectId(vehicleId))
                throw ApiError_1.ApiError.badRequest('Invalid vehicle ID');
            yield this.savedVehicleRepo.deleteByUserAndVehicle(userId, vehicleId);
        });
    }
    saveVehicleFromApiListing(listing_1) {
        return __awaiter(this, arguments, void 0, function* (listing, photos = [], specs) {
            const vin = listing.vin;
            if (!vin)
                throw ApiError_1.ApiError.badRequest('VIN is required');
            const existing = yield this.vehicleRepo.findByVIN(vin);
            if (existing) {
                if (existing.apiSyncStatus === 'PENDING') {
                    const [fetchedPhotos, fetchedSpecs] = yield Promise.all([
                        photos.length > 0 ? Promise.resolve(photos) : this.autoDevService.fetchPhotos(vin).catch(() => []),
                        specs || this.autoDevService.fetchSpecifications(vin).catch(() => null),
                    ]);
                    const vehicleData = vehicle_transformer_1.VehicleTransformer.fromAutoDevListing(listing, fetchedPhotos, fetchedSpecs);
                    vehicleData.apiData = {
                        listing,
                        specs: fetchedSpecs,
                        photos: fetchedPhotos,
                        raw: listing,
                        syncedAt: new Date().toISOString(),
                    };
                    vehicleData.lastApiSync = new Date();
                    vehicleData.apiSyncStatus = 'SYNCED';
                    vehicleData.apiSyncError = null;
                    return this.vehicleRepo.update(existing.id, vehicleData);
                }
                return existing;
            }
            const [fetchedPhotos, fetchedSpecs] = yield Promise.all([
                photos.length > 0 ? Promise.resolve(photos) : this.autoDevService.fetchPhotos(vin).catch(() => []),
                specs || this.autoDevService.fetchSpecifications(vin).catch(() => null),
            ]);
            const vehicleData = vehicle_transformer_1.VehicleTransformer.fromAutoDevListing(listing, fetchedPhotos, fetchedSpecs);
            vehicleData.apiData = {
                listing,
                specs: fetchedSpecs,
                photos: fetchedPhotos,
                raw: listing,
                syncedAt: new Date().toISOString(),
            };
            vehicleData.lastApiSync = new Date();
            vehicleData.apiSyncStatus = 'SYNCED';
            return this.vehicleRepo.create(vehicleData);
        });
    }
};
exports.VehicleServiceDirect = VehicleServiceDirect;
VehicleServiceDirect.DEFAULT_RECOMMENDATION_REASON = 'Near-new, under 15k miles, exceptional condition at this price';
exports.VehicleServiceDirect = VehicleServiceDirect = VehicleServiceDirect_1 = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.VehicleRepository)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.SavedVehicleRepository)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.AutoDevService)),
    __param(3, (0, inversify_1.inject)(types_1.TYPES.TrendingService)),
    __param(4, (0, inversify_1.inject)(types_1.TYPES.RecommendedService)),
    __param(5, (0, inversify_1.inject)(types_1.TYPES.CategoryService)),
    __metadata("design:paramtypes", [VehicleRepository_1.VehicleRepository,
        SavedVehicleRepository_1.SavedVehicleRepository,
        AutoDevService_1.AutoDevService,
        TrendingService_1.TrendingService,
        RecommendedService_1.RecommendedService,
        CategoryService_1.CategoryService])
], VehicleServiceDirect);
