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
const vehicle_transformer_1 = require("../helpers/vehicle-transformer");
const client_1 = require("../generated/prisma/client");
const ApiError_1 = require("../utils/ApiError");
const loggers_1 = __importDefault(require("../utils/loggers"));
let VehicleService = class VehicleService {
    constructor(vehicleRepo, autoDevService) {
        this.vehicleRepo = vehicleRepo;
        this.autoDevService = autoDevService;
    }
    /**
     * Get vehicles with filters and pagination (Hybrid: DB first, API fallback)
     */
    getVehicles(filters_1) {
        return __awaiter(this, arguments, void 0, function* (filters, pagination = {}, includeApiResults = true) {
            const page = pagination.page || 1;
            const limit = pagination.limit || 50;
            // Step 1: Search DB first
            const dbResult = yield this.vehicleRepo.findMany(filters, pagination);
            const dbPages = Math.ceil(dbResult.total / limit);
            // Step 2: If DB results are insufficient, fetch from Auto.dev API
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
                        apiFilters.zip = filters.dealerState; // Approximate mapping
                    // Fetch from Auto.dev (don't save yet - only return)
                    const apiListings = yield this.autoDevService.fetchListings(Object.assign(Object.assign({}, apiFilters), { page: 1, limit: limit - dbResult.vehicles.length }));
                    // Transform API listings to Vehicle format (but don't save to DB)
                    // Batch check existing VINs to avoid N+1 queries
                    const vinsToCheck = apiListings.map(l => l.vin);
                    const existingVins = new Set();
                    // Check which VINs already exist in DB (batch)
                    for (const vin of vinsToCheck) {
                        const existing = yield this.vehicleRepo.findByVIN(vin);
                        if (existing) {
                            existingVins.add(vin);
                        }
                    }
                    // Transform only new listings (not in DB)
                    for (const listing of apiListings) {
                        if (!existingVins.has(listing.vin) && apiVehicles.length < (limit - dbResult.vehicles.length)) {
                            // Transform but don't save - these are temporary results
                            // Don't fetch photos here to save API calls - fetch on-demand when user views
                            const vehicleData = vehicle_transformer_1.VehicleTransformer.fromAutoDevListing(listing, []);
                            // Store full API response for future compatibility
                            vehicleData.apiData = {
                                listing,
                                raw: listing,
                                isTemporary: true, // Flag to indicate not saved yet
                            };
                            vehicleData.apiSyncStatus = 'PENDING'; // Not saved yet
                            vehicleData.id = `temp-${listing.vin}`; // Temporary ID for frontend
                            // Create temporary vehicle object (not persisted)
                            apiVehicles.push(vehicleData);
                            fromApiCount++;
                        }
                    }
                }
                catch (error) {
                    loggers_1.default.warn('Failed to fetch from Auto.dev API, returning DB results only:', error);
                    // Continue with DB results only
                }
            }
            // Step 3: Combine results (DB first, then API)
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
     * Get vehicle by ID (with Auto.dev fallback if not found)
     * Saves vehicle to DB if found in API (user interaction = save trigger)
     */
    getVehicleById(id, vin) {
        return __awaiter(this, void 0, void 0, function* () {
            // Try DB first
            let vehicle = yield this.vehicleRepo.findById(id);
            // If not found and VIN provided, try Auto.dev API
            if (!vehicle && vin) {
                try {
                    vehicle = yield this.syncFromAutoDev(vin);
                    loggers_1.default.info(`Vehicle ${vin} synced from Auto.dev and saved to DB`);
                }
                catch (error) {
                    loggers_1.default.warn(`Failed to sync vehicle ${vin} from Auto.dev:`, error);
                }
            }
            if (!vehicle) {
                throw ApiError_1.ApiError.notFound('Vehicle not found');
            }
            // Increment view count asynchronously
            this.vehicleRepo.incrementViewCount(vehicle.id).catch((err) => {
                loggers_1.default.error('Failed to increment view count:', err);
            });
            return vehicle;
        });
    }
    /**
     * Get vehicle by VIN
     */
    getVehicleByVIN(vin) {
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
     * Update vehicle
     */
    updateVehicle(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
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
            yield this.vehicleRepo.delete(id);
        });
    }
    /**
     * Save vehicle from Auto.dev API listing (called when user interacts with API result)
     * This saves vehicles that users actually view/interact with
     */
    saveVehicleFromApiListing(listing_1) {
        return __awaiter(this, arguments, void 0, function* (listing, photos = [], specs) {
            // Check if already exists
            const existing = yield this.vehicleRepo.findByVIN(listing.vin);
            if (existing) {
                // Update if exists but was temporary
                if (existing.apiSyncStatus === 'PENDING') {
                    // Fetch full data if not provided
                    const [fetchedPhotos, fetchedSpecs] = yield Promise.all([
                        photos.length > 0 ? Promise.resolve(photos) : this.autoDevService.fetchPhotos(listing.vin).catch(() => []),
                        specs || this.autoDevService.fetchSpecifications(listing.vin).catch(() => null),
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
            // Fetch full data if not provided
            const [fetchedPhotos, fetchedSpecs] = yield Promise.all([
                photos.length > 0 ? Promise.resolve(photos) : this.autoDevService.fetchPhotos(listing.vin).catch(() => []),
                specs || this.autoDevService.fetchSpecifications(listing.vin).catch(() => null),
            ]);
            // Transform and save
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
exports.VehicleService = VehicleService;
exports.VehicleService = VehicleService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.VehicleRepository)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.AutoDevService)),
    __metadata("design:paramtypes", [VehicleRepository_1.VehicleRepository,
        AutoDevService_1.AutoDevService])
], VehicleService);
