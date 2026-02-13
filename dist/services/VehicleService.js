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
     * Get vehicles with filters and pagination (Hybrid: DB first, Redis cache, API fallback).
     * DB results are filtered by the repository. For API/Redis listings, we apply in-memory filtering
     * (price, mileage, vehicleType, location, year) since Auto.dev API doesn't support these filters.
     * This ensures all filters work correctly: price range, mileage max, car type, location, year, make/model, search.
     */
    getVehicles(filters_1) {
        return __awaiter(this, arguments, void 0, function* (filters, pagination = {}, includeApiResults = true) {
            var _a;
            const page = pagination.page || 1;
            const limit = pagination.limit || 50;
            // Step 1: Search DB first
            const dbResult = yield this.vehicleRepo.findMany(filters, pagination);
            // Step 1.5: Refresh prices for stale vehicles in DB (async, non-blocking)
            const staleVehicles = dbResult.vehicles.filter(v => this.isPriceStale(v));
            const priceRefreshPromises = staleVehicles.map(v => this.refreshVehiclePrice(v).catch(() => null));
            // Don't await - let it run in background, but refresh the vehicles we return
            Promise.all(priceRefreshPromises).catch(() => { });
            // Step 2: Get full API list from Redis (or fetch all pages from Auto.dev and cache)
            // Then filter in-memory and paginate so total/pages include API results
            let apiVehicles = [];
            let fromApiCount = 0;
            let apiOnlyCount = 0; // count of API-only listings (not in DB) after filters
            if (includeApiResults) {
                try {
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
                    // Cache key: full list per apiFilters (no page) – we store everything from Auto.dev for this filter
                    const cacheKey = RedisCacheService_1.RedisCacheService.getVehicleListingsKey(Object.assign(Object.assign({}, apiFilters), { full: true }));
                    const cachedResult = yield this.cache.get(cacheKey);
                    let apiListings = [];
                    if ((_a = cachedResult === null || cachedResult === void 0 ? void 0 : cachedResult.listings) === null || _a === void 0 ? void 0 : _a.length) {
                        loggers_1.default.info(`Using cached full vehicle listings for filters: ${JSON.stringify(apiFilters)}`);
                        apiListings = cachedResult.listings;
                    }
                    else {
                        // Fetch all pages from Auto.dev and cache
                        apiListings = yield this.autoDevService.fetchAllListings(apiFilters);
                        yield this.cache.set(cacheKey, { listings: apiListings });
                        loggers_1.default.info(`Cached full vehicle listings (${apiListings.length}) for filters: ${JSON.stringify(apiFilters)}`);
                    }
                    // Apply in-memory filters (price, mileage, year, vehicleType, location, search)
                    const filteredListings = apiListings.filter((listing) => {
                        var _a, _b, _c, _d, _e, _f, _g;
                        const vehicle = listing.vehicle || listing;
                        const retailListing = listing.retailListing || {};
                        if (filters.search) {
                            const searchTerm = filters.search.trim();
                            const searchLower = searchTerm.toLowerCase();
                            const model = (vehicle.model || listing.model || '').toLowerCase();
                            const vin = (listing.vin || vehicle.vin || '').toUpperCase();
                            const isFullVIN = searchTerm.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/i.test(searchTerm);
                            let matchesSearch = false;
                            if (!filters.model && model.includes(searchLower))
                                matchesSearch = true;
                            if (isFullVIN && vin === searchTerm.toUpperCase())
                                matchesSearch = true;
                            else if ((filters.make || filters.model) && vin.includes(searchTerm.toUpperCase()))
                                matchesSearch = true;
                            if (!matchesSearch)
                                return false;
                        }
                        const price = (_b = (_a = retailListing.price) !== null && _a !== void 0 ? _a : listing.price) !== null && _b !== void 0 ? _b : 0;
                        if (filters.priceMin != null && price < filters.priceMin)
                            return false;
                        if (filters.priceMax != null && price > filters.priceMax)
                            return false;
                        const mileage = (_f = (_e = (_d = (_c = retailListing.miles) !== null && _c !== void 0 ? _c : retailListing.mileage) !== null && _d !== void 0 ? _d : listing.miles) !== null && _e !== void 0 ? _e : listing.mileage) !== null && _f !== void 0 ? _f : undefined;
                        if (filters.mileageMax != null && (mileage == null || mileage > filters.mileageMax))
                            return false;
                        const listingYear = (_g = vehicle.year) !== null && _g !== void 0 ? _g : listing.year;
                        if (filters.yearMin != null && (listingYear == null || listingYear < filters.yearMin))
                            return false;
                        if (filters.yearMax != null && (listingYear == null || listingYear > filters.yearMax))
                            return false;
                        if (filters.vehicleType) {
                            const bodyStyle = vehicle.bodyStyle || listing.bodyStyle || '';
                            if (vehicle_transformer_1.VehicleTransformer.mapVehicleType(bodyStyle) !== filters.vehicleType)
                                return false;
                        }
                        if (filters.dealerState) {
                            const listingState = (retailListing.state || listing.dealerState || '').toLowerCase();
                            if (listingState !== filters.dealerState.toLowerCase())
                                return false;
                        }
                        return true;
                    });
                    const vinsToCheck = filteredListings.map((l) => l.vin).filter(Boolean);
                    const existingVins = yield this.vehicleRepo.findExistingVINs(vinsToCheck);
                    const apiOnlyList = filteredListings.filter((l) => l.vin && !existingVins.has(l.vin));
                    apiOnlyCount = apiOnlyList.length;
                    // Paginate API slice for this page: DB fills first, then API fills the rest of the page
                    const apiOffset = Math.max(0, (page - 1) * limit - dbResult.total);
                    const needCount = limit - dbResult.vehicles.length;
                    const apiChunk = apiOnlyList.slice(apiOffset, apiOffset + needCount);
                    for (const listing of apiChunk) {
                        const vehicleData = vehicle_transformer_1.VehicleTransformer.fromAutoDevListing(listing, []);
                        vehicleData.apiData = {
                            listing,
                            raw: listing,
                            isTemporary: true,
                            cached: !!cachedResult,
                        };
                        vehicleData.apiSyncStatus = 'PENDING';
                        vehicleData.id = `temp-${listing.vin}`;
                        apiVehicles.push(vehicleData);
                    }
                    fromApiCount = apiVehicles.length;
                }
                catch (error) {
                    loggers_1.default.warn('Failed to fetch from Auto.dev API, returning DB results only:', error);
                }
            }
            // Step 3: Combined total and pages (DB + API-only count) so frontend can paginate
            const total = dbResult.total + apiOnlyCount;
            const pages = Math.ceil(total / limit) || 1;
            const allVehicles = [...dbResult.vehicles, ...apiVehicles];
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
            if (type === 'vin') {
                return this.getVehicleByVIN(identifier);
            }
            const trim = (identifier || '').trim();
            if (trim.startsWith('temp-')) {
                return this.getVehicleByVIN(trim.replace(/^temp-/, ''));
            }
            if (this.looksLikeVin(trim)) {
                return this.getVehicleByVIN(trim);
            }
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
            // Prefer DB if we have this vehicle (create/sync)
            const fromDb = yield this.vehicleRepo.findByVIN(normalizedVin);
            if (fromDb) {
                vehicle = fromDb;
                if (this.isPriceStale(vehicle)) {
                    const refreshed = yield this.refreshVehiclePrice(vehicle);
                    if (refreshed)
                        vehicle = refreshed;
                }
                this.vehicleRepo.incrementViewCount(vehicle.id).catch((err) => loggers_1.default.error('Failed to increment view count:', err));
                return vehicle;
            }
            // Check Redis cache, then Auto.dev
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
    /** MongoDB ObjectId: exactly 24 hex characters */
    isMongoObjectId(s) {
        return /^[a-fA-F0-9]{24}$/.test((s || '').trim());
    }
    /** VIN: exactly 17 alphanumeric characters */
    looksLikeVin(s) {
        const t = (s || '').trim();
        return t.length === 17 && /^[A-HJ-NPR-Z0-9]+$/i.test(t);
    }
    /**
     * Update vehicle
     */
    updateVehicle(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isValidId(id)) {
                throw ApiError_1.ApiError.badRequest('Invalid vehicle ID provided');
            }
            if (!this.isMongoObjectId(id)) {
                throw ApiError_1.ApiError.badRequest('Vehicle ID must be a 24-character hex string (MongoDB ObjectId). This endpoint does not accept VINs.');
            }
            const existing = yield this.vehicleRepo.findById(id);
            if (!existing) {
                throw ApiError_1.ApiError.notFound('Vehicle not found');
            }
            return this.vehicleRepo.update(id, data);
        });
    }
    /**
     * Delete vehicle (soft delete)
     */
    deleteVehicle(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isValidId(id)) {
                throw ApiError_1.ApiError.badRequest('Invalid vehicle ID provided');
            }
            if (!this.isMongoObjectId(id)) {
                throw ApiError_1.ApiError.badRequest('Vehicle ID must be a 24-character hex string (MongoDB ObjectId). This endpoint does not accept VINs.');
            }
            const existing = yield this.vehicleRepo.findById(id);
            if (!existing) {
                throw ApiError_1.ApiError.notFound('Vehicle not found');
            }
            yield this.vehicleRepo.delete(id);
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
