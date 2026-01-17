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
exports.VehicleService = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const VehicleRepository_1 = require("../repositories/VehicleRepository");
const AutoDevService_1 = require("./AutoDevService");
const RedisCacheService_1 = require("./RedisCacheService");
const vehicle_transformer_1 = require("../helpers/vehicle-transformer");
const vehicleLogs_1 = require("../helpers/vehicleLogs");
const client_1 = require("../generated/prisma/client");
const ApiError_1 = require("../utils/ApiError");
const loggers_1 = __importDefault(require("../utils/loggers"));
let VehicleService = class VehicleService {
    constructor(vehicleRepo, autoDevService, cache) {
        this.vehicleRepo = vehicleRepo;
        this.autoDevService = autoDevService;
        this.cache = cache;
        // Get cache TTL in hours (default 12)
        this.cacheTTLHours = parseInt(process.env.REDIS_CACHE_TTL_HOURS || '12', 10);
    }
    /**
     * Check if vehicle price data is stale (needs refresh)
     */
    isPriceStale(vehicle) {
        if (!vehicle.lastApiSync || vehicle.source !== client_1.VehicleSource.API) {
            return false; // Manual vehicles don't need price refresh
        }
        const now = new Date();
        const lastSync = new Date(vehicle.lastApiSync);
        const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
        return hoursSinceSync >= this.cacheTTLHours;
    }
    /**
     * Refresh vehicle price from cache/API if stale
     * Updates price in DB and adds to priceHistory if changed
     */
    refreshVehiclePrice(vehicle) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (!vehicle.vin || !this.isPriceStale(vehicle)) {
                return null; // Not stale or no VIN
            }
            const oldPrice = vehicle.priceUsd;
            const lastSync = vehicle.lastApiSync ? new Date(vehicle.lastApiSync).toISOString() : 'never';
            const hoursStale = vehicle.lastApiSync
                ? ((new Date().getTime() - new Date(vehicle.lastApiSync).getTime()) / (1000 * 60 * 60)).toFixed(1)
                : 'unknown';
            try {
                // Check cache first
                const cacheKey = RedisCacheService_1.RedisCacheService.getVehicleByVINKey(vehicle.vin);
                const cachedListing = yield this.cache.get(cacheKey);
                let listing = null;
                let dataSource = 'api';
                if (cachedListing === null || cachedListing === void 0 ? void 0 : cachedListing.listing) {
                    listing = cachedListing.listing;
                    dataSource = 'cache';
                }
                else {
                    // Fetch from API
                    listing = yield this.autoDevService.fetchListingByVIN(vehicle.vin);
                    if (listing) {
                        // Cache it
                        yield this.cache.set(cacheKey, { listing });
                        dataSource = 'api';
                    }
                }
                if (!listing || !listing.price) {
                    return null; // No price data available
                }
                const newPrice = listing.price;
                const priceDiff = newPrice - oldPrice;
                const priceDiffPercent = ((priceDiff / oldPrice) * 100).toFixed(2);
                const priceChangeDirection = priceDiff > 0 ? 'INCREASE' : priceDiff < 0 ? 'DECREASE' : 'NO_CHANGE';
                // Only update if price changed
                if (Math.abs(priceDiff) > 0.01) { // Allow for floating point precision
                    const priceHistory = Array.isArray(vehicle.priceHistory)
                        ? [...vehicle.priceHistory]
                        : [];
                    // Add to price history
                    const historyEntry = {
                        date: new Date().toISOString(),
                        price: newPrice,
                        previousPrice: oldPrice,
                        priceChange: priceDiff,
                        priceChangePercent: parseFloat(priceDiffPercent),
                        reason: 'API_PRICE_UPDATE',
                        source: 'autodev',
                        dataSource, // 'cache' or 'api'
                    };
                    priceHistory.push(historyEntry);
                    // Update vehicle with new price
                    const updateData = {
                        priceUsd: newPrice,
                        priceHistory: priceHistory, // Cast to satisfy Prisma JSON type
                        lastApiSync: new Date(),
                        apiSyncStatus: 'SYNCED',
                        apiSyncError: null,
                        // Update apiData with fresh listing
                        apiData: Object.assign(Object.assign({}, (vehicle.apiData || {})), { listing, raw: listing, syncedAt: new Date().toISOString() }),
                    };
                    const updated = yield this.vehicleRepo.update(vehicle.id, updateData);
                    // Log to ActivityLog table (database)
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
                        dataSource,
                        lastSync: (_a = vehicle.lastApiSync) === null || _a === void 0 ? void 0 : _a.toISOString(),
                        hoursStale: hoursStale,
                        priceHistoryCount: priceHistory.length,
                    });
                    return updated;
                }
                else {
                    // Price unchanged, just update lastApiSync
                    yield this.vehicleRepo.update(vehicle.id, {
                        lastApiSync: new Date(),
                        apiSyncStatus: 'SYNCED',
                    });
                    // Log price refresh (even if unchanged) to ActivityLog
                    yield vehicleLogs_1.VehicleLogs.logPriceRefresh(vehicle, {
                        vin: vehicle.vin,
                        make: vehicle.make,
                        model: vehicle.model,
                        year: vehicle.year,
                        price: oldPrice,
                        dataSource,
                        lastSync: (_b = vehicle.lastApiSync) === null || _b === void 0 ? void 0 : _b.toISOString(),
                        hoursStale: hoursStale,
                        status: 'unchanged',
                    });
                    return null;
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                // Mark as outdated but don't fail the request
                yield this.vehicleRepo.update(vehicle.id, {
                    apiSyncStatus: 'OUTDATED',
                    apiSyncError: errorMessage,
                }).catch(() => { });
                // Log failure to ActivityLog
                yield vehicleLogs_1.VehicleLogs.logPriceRefreshFailed(vehicle, {
                    vin: vehicle.vin,
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year,
                    currentPrice: oldPrice,
                    error: errorMessage,
                    lastSync: (_c = vehicle.lastApiSync) === null || _c === void 0 ? void 0 : _c.toISOString(),
                    hoursStale: hoursStale,
                    status: 'failed',
                });
                return null;
            }
        });
    }
    /**
     * Get vehicles with filters and pagination (Hybrid: DB first, Redis cache, API fallback)
     * API responses are cached in Redis (12hr TTL) to handle price changes and reduce API calls
     * Vehicles are only saved to DB when user initiates payment
     */
    getVehicles(filters_1) {
        return __awaiter(this, arguments, void 0, function* (filters, pagination = {}, includeApiResults = true) {
            const page = pagination.page || 1;
            const limit = pagination.limit || 50;
            // Step 1: Search DB first
            const dbResult = yield this.vehicleRepo.findMany(filters, pagination);
            // Step 1.5: Refresh prices for stale vehicles in DB (async, non-blocking)
            const staleVehicles = dbResult.vehicles.filter(v => this.isPriceStale(v));
            const priceRefreshPromises = staleVehicles.map(v => this.refreshVehiclePrice(v).catch(() => null));
            // Don't await - let it run in background, but refresh the vehicles we return
            Promise.all(priceRefreshPromises).catch(() => { });
            // Step 2: If DB results are insufficient, check Redis cache, then Auto.dev API
            let apiVehicles = [];
            let fromApiCount = 0;
            if (includeApiResults && dbResult.vehicles.length < limit) {
                try {
                    // Map our filters to Auto.dev API filters
                    const apiFilters = {};
                    if (filters.make)
                        apiFilters.make = filters.make;
                    if (filters.model)
                        apiFilters.model = filters.model;
                    if (filters.yearMin || filters.yearMax) {
                        if (filters.yearMin && filters.yearMax && filters.yearMin === filters.yearMax) {
                            apiFilters.year = filters.yearMin;
                        }
                        else if (filters.yearMin) {
                            apiFilters.year = filters.yearMin;
                        }
                    }
                    if (filters.dealerState)
                        apiFilters.zip = filters.dealerState;
                    // Check Redis cache first
                    const cacheKey = RedisCacheService_1.RedisCacheService.getVehicleListingsKey(Object.assign(Object.assign({}, apiFilters), { page, limit }));
                    const cachedResult = yield this.cache.get(cacheKey);
                    let apiListings = [];
                    if (cachedResult) {
                        // Use cached results
                        loggers_1.default.info(`Using cached vehicle listings for filters: ${JSON.stringify(apiFilters)}`);
                        apiListings = cachedResult.listings;
                    }
                    else {
                        // Fetch from Auto.dev API
                        apiListings = yield this.autoDevService.fetchListings(Object.assign(Object.assign({}, apiFilters), { page: 1, limit: limit - dbResult.vehicles.length }));
                        // Cache the API response (12hr TTL handles price changes)
                        yield this.cache.set(cacheKey, {
                            listings: apiListings,
                            total: apiListings.length,
                        });
                        loggers_1.default.info(`Cached vehicle listings for filters: ${JSON.stringify(apiFilters)}`);
                    }
                    // Batch check existing VINs to avoid N+1 queries
                    const vinsToCheck = apiListings.map(l => l.vin);
                    const existingVins = new Set();
                    for (const vin of vinsToCheck) {
                        const existing = yield this.vehicleRepo.findByVIN(vin);
                        if (existing) {
                            existingVins.add(vin);
                        }
                    }
                    // Transform only new listings (not in DB)
                    for (const listing of apiListings) {
                        if (!existingVins.has(listing.vin) && apiVehicles.length < (limit - dbResult.vehicles.length)) {
                            // Transform but don't save to DB - cache only
                            const vehicleData = vehicle_transformer_1.VehicleTransformer.fromAutoDevListing(listing, []);
                            vehicleData.apiData = {
                                listing,
                                raw: listing,
                                isTemporary: true, // Flag to indicate not saved to DB yet
                                cached: true, // Flag to indicate from cache
                            };
                            vehicleData.apiSyncStatus = 'PENDING'; // Not saved to DB yet
                            vehicleData.id = `temp-${listing.vin}`; // Temporary ID for frontend
                            apiVehicles.push(vehicleData);
                            fromApiCount++;
                        }
                    }
                }
                catch (error) {
                    loggers_1.default.warn('Failed to fetch from Auto.dev API, returning DB results only:', error);
                }
            }
            // Step 3: Combine results (DB first, then cached API)
            const allVehicles = [...dbResult.vehicles, ...apiVehicles];
            const total = dbResult.total + fromApiCount;
            const pages = Math.ceil(total / limit);
            return {
                vehicles: allVehicles,
                total,
                page,
                limit,
                pages,
                fromApi: fromApiCount,
            };
        });
    }
    /**
     * Get vehicle by identifier (ID or VIN) with type parameter
     * Flow: DB → Redis → API
     * Does NOT save new vehicles to DB - only returns cached/API data
     * Vehicle is saved to DB only when payment is initiated
     */
    getVehicle(identifier_1) {
        return __awaiter(this, arguments, void 0, function* (identifier, type = 'id') {
            if (type === 'id') {
                // Type is ID: Try DB first, then Redis/API fallback
                if (this.isValidId(identifier)) {
                    try {
                        let vehicle = yield this.vehicleRepo.findById(identifier);
                        // If found in DB, check if price needs refresh
                        if (vehicle && this.isPriceStale(vehicle)) {
                            const refreshed = yield this.refreshVehiclePrice(vehicle);
                            if (refreshed) {
                                vehicle = refreshed;
                            }
                        }
                        if (vehicle) {
                            // Increment view count asynchronously
                            this.vehicleRepo.incrementViewCount(vehicle.id).catch((err) => {
                                loggers_1.default.error('Failed to increment view count:', err);
                            });
                            return vehicle;
                        }
                    }
                    catch (error) {
                        // If DB lookup fails, log and continue to Redis/API lookup
                        loggers_1.default.warn(`Failed to lookup vehicle by ID ${identifier}, falling back to Redis/API:`, error);
                    }
                }
                // ID not found in DB or invalid, try Redis/API with VIN if available
                // For temporary IDs, extract VIN
                const vinToUse = identifier.startsWith('temp-')
                    ? identifier.replace(/^temp-/, '')
                    : undefined;
                if (!vinToUse) {
                    throw ApiError_1.ApiError.notFound('Vehicle not found');
                }
                return this.getVehicleByVIN(vinToUse);
            }
            else {
                // Type is VIN: Try Redis first, then API
                return this.getVehicleByVIN(identifier);
            }
        });
    }
    /**
     * Get vehicle by VIN (Redis cache and Auto.dev API)
     * Flow: Redis → API
     * Does NOT save to DB - only returns cached/API data
     */
    getVehicleByVIN(vin) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!vin || vin.trim().length !== 17) {
                throw ApiError_1.ApiError.badRequest('Invalid VIN. Must be 17 characters');
            }
            const normalizedVin = vin.trim().toUpperCase();
            let vehicle = null;
            // Check Redis cache first
            const cacheKey = RedisCacheService_1.RedisCacheService.getVehicleByVINKey(normalizedVin);
            const cachedVehicle = yield this.cache.get(cacheKey);
            if (cachedVehicle) {
                loggers_1.default.info(`Using cached vehicle data for VIN: ${normalizedVin}`);
                vehicle = cachedVehicle;
            }
            else {
                // Fetch from Auto.dev API and cache it (don't save to DB)
                try {
                    const [listing, photos, specs] = yield Promise.all([
                        this.autoDevService.fetchListingByVIN(normalizedVin),
                        this.autoDevService.fetchPhotos(normalizedVin),
                        this.autoDevService.fetchSpecifications(normalizedVin),
                    ]);
                    if (listing) {
                        const vehicleData = vehicle_transformer_1.VehicleTransformer.fromAutoDevListing(listing, photos, specs);
                        vehicleData.apiData = {
                            listing,
                            specs,
                            photos,
                            raw: listing,
                            cached: true,
                            isTemporary: true,
                        };
                        vehicleData.apiSyncStatus = 'PENDING';
                        vehicleData.id = `temp-${normalizedVin}`;
                        // Cache the vehicle data (12hr TTL)
                        yield this.cache.set(cacheKey, vehicleData);
                        loggers_1.default.info(`Cached vehicle data for VIN: ${normalizedVin}`);
                        vehicle = vehicleData;
                    }
                }
                catch (error) {
                    loggers_1.default.warn(`Failed to fetch vehicle ${normalizedVin} from Auto.dev:`, error);
                }
            }
            if (!vehicle) {
                throw ApiError_1.ApiError.notFound('Vehicle not found');
            }
            // Increment view count asynchronously (only if in DB)
            if (vehicle.id && !vehicle.id.startsWith('temp-')) {
                this.vehicleRepo.incrementViewCount(vehicle.id).catch((err) => {
                    loggers_1.default.error('Failed to increment view count:', err);
                });
            }
            return vehicle;
        });
    }
    /**
     * Get vehicle by VIN from database only (internal use)
     */
    getVehicleByVINFromDB(vin) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.vehicleRepo.findByVIN(vin);
        });
    }
    /**
     * Create vehicle from manual entry
     */
    createVehicle(dto, addedBy) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if VIN already exists
            const existing = yield this.vehicleRepo.findByVIN(dto.vin);
            if (existing) {
                throw ApiError_1.ApiError.conflict('Vehicle with this VIN already exists');
            }
            return this.vehicleRepo.create(Object.assign(Object.assign({}, dto), { source: dto.source || client_1.VehicleSource.MANUAL, addedBy, isActive: dto.isActive !== false, isHidden: dto.isHidden || false }));
        });
    }
    /**
     * Sync vehicle from Auto.dev API
     */
    syncFromAutoDev(vin) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield this.vehicleRepo.findByVIN(vin);
            try {
                // Fetch from Auto.dev
                const [listing, photos, specs] = yield Promise.all([
                    this.autoDevService.fetchListingByVIN(vin),
                    this.autoDevService.fetchPhotos(vin),
                    this.autoDevService.fetchSpecifications(vin),
                ]);
                if (!listing) {
                    // Mark as failed if vehicle exists, otherwise throw error
                    if (existing) {
                        yield this.vehicleRepo.update(existing.id, {
                            apiSyncStatus: 'FAILED',
                            apiSyncError: 'Vehicle not found in Auto.dev',
                        });
                    }
                    throw ApiError_1.ApiError.notFound('Vehicle not found in Auto.dev');
                }
                // Transform to our model
                const vehicleData = vehicle_transformer_1.VehicleTransformer.fromAutoDevListing(listing, photos, specs);
                // Store FULL API response for future compatibility (handles API field changes)
                vehicleData.apiData = {
                    listing,
                    specs,
                    photos,
                    raw: listing, // Store complete raw response
                    syncedAt: new Date().toISOString(),
                };
                vehicleData.lastApiSync = new Date();
                vehicleData.apiSyncStatus = 'SYNCED';
                vehicleData.apiSyncError = null; // Clear any previous errors
                if (existing) {
                    // Update existing
                    return this.vehicleRepo.update(existing.id, vehicleData);
                }
                else {
                    // Create new
                    return this.vehicleRepo.create(vehicleData);
                }
            }
            catch (error) {
                loggers_1.default.error('Failed to sync vehicle from Auto.dev:', error);
                // Update status to FAILED if vehicle exists
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
    /**
     * Check if ID is valid (not null, empty, or invalid route parameter)
     */
    isValidId(id) {
        return !!(id && id.trim() && !id.startsWith(':') && id !== 'null' && id !== 'undefined');
    }
    /**
     * Update vehicle
     */
    updateVehicle(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.isValidId(id)) {
                throw ApiError_1.ApiError.badRequest('Invalid vehicle ID provided');
            }
            try {
                const existing = yield this.vehicleRepo.findById(id);
                if (!existing) {
                    throw ApiError_1.ApiError.notFound('Vehicle not found');
                }
                return this.vehicleRepo.update(id, data);
            }
            catch (error) {
                // If Prisma error due to invalid ObjectID format
                if (error.code === 'P2023' || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('Malformed ObjectID'))) {
                    throw ApiError_1.ApiError.badRequest('Invalid vehicle ID format');
                }
                throw error;
            }
        });
    }
    /**
     * Delete vehicle (soft delete)
     */
    deleteVehicle(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.isValidId(id)) {
                throw ApiError_1.ApiError.badRequest('Invalid vehicle ID provided');
            }
            try {
                yield this.vehicleRepo.delete(id);
            }
            catch (error) {
                // If Prisma error due to invalid ObjectID format
                if (error.code === 'P2023' || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('Malformed ObjectID'))) {
                    throw ApiError_1.ApiError.badRequest('Invalid vehicle ID format');
                }
                throw error;
            }
        });
    }
    /**
     * Save vehicle from Auto.dev API to DB (called when user initiates payment)
     * This is the ONLY place where vehicles are saved to DB from API
     * Payment initiation = save trigger
     */
    saveVehicleFromApiListing(listing_1) {
        return __awaiter(this, arguments, void 0, function* (listing, photos = [], specs) {
            const vin = listing.vin;
            if (!vin) {
                throw ApiError_1.ApiError.badRequest('VIN is required');
            }
            // Check if already exists in DB
            const existing = yield this.vehicleRepo.findByVIN(vin);
            if (existing) {
                // Update if exists but was temporary/pending
                if (existing.apiSyncStatus === 'PENDING') {
                    // Fetch full data if not provided
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
                    // Invalidate cache for this vehicle
                    yield this.cache.delete(RedisCacheService_1.RedisCacheService.getVehicleByVINKey(vin));
                    yield this.cache.deleteByPattern('vehicle:listings:*'); // Invalidate listings cache
                    return this.vehicleRepo.update(existing.id, vehicleData);
                }
                return existing;
            }
            // Fetch full data if not provided
            const [fetchedPhotos, fetchedSpecs] = yield Promise.all([
                photos.length > 0 ? Promise.resolve(photos) : this.autoDevService.fetchPhotos(vin).catch(() => []),
                specs || this.autoDevService.fetchSpecifications(vin).catch(() => null),
            ]);
            // Transform and save to DB
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
            // Invalidate cache
            yield this.cache.delete(RedisCacheService_1.RedisCacheService.getVehicleByVINKey(vin));
            yield this.cache.deleteByPattern('vehicle:listings:*');
            return this.vehicleRepo.create(vehicleData);
        });
    }
};
exports.VehicleService = VehicleService;
exports.VehicleService = VehicleService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.VehicleRepository)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.AutoDevService)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.RedisCacheService)),
    __metadata("design:paramtypes", [VehicleRepository_1.VehicleRepository,
        AutoDevService_1.AutoDevService,
        RedisCacheService_1.RedisCacheService])
], VehicleService);
