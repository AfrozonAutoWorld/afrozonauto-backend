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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerVehicleService = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const VehicleRepository_1 = require("../repositories/VehicleRepository");
const ProfileRepository_1 = require("../repositories/ProfileRepository");
const client_1 = require("../generated/prisma/client");
const ApiError_1 = require("../utils/ApiError");
let SellerVehicleService = class SellerVehicleService {
    constructor(vehicleRepo, profileRepo) {
        this.vehicleRepo = vehicleRepo;
        this.profileRepo = profileRepo;
    }
    /**
     * Submit a new vehicle listing
     */
    submitListing(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // if (data.userId) {
            //     const profile = await this.profileRepo.findUserById(data.userId);
            //     if (!profile || !profile.isSeller) {
            //         throw ApiError.forbidden('You must be a verified seller to list vehicles');
            //     }
            // }
            // additionalNotes (UI field) → manualNotes (Vehicle model field)
            if (data.additionalNotes !== undefined) {
                data.manualNotes = data.additionalNotes;
                delete data.additionalNotes;
            }
            // Generate a unique VIN placeholder if the seller doesn't know theirs
            if (!data.vin) {
                data.vin = `SELLER-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            }
            // Auto-generate slug from make/model/year
            if (!data.slug) {
                const base = `${data.year}-${data.make}-${data.model}`
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
                data.slug = `${base}-${Date.now()}`;
            }
            data.source = client_1.VehicleSource.SELLER;
            data.status = client_1.VehicleStatus.PENDING_REVIEW;
            return this.vehicleRepo.createSellerListing(data);
        });
    }
    /**
     * Get a listing by ID
     */
    getListingById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const listing = yield this.vehicleRepo.findSellerById(id);
            if (!listing)
                throw ApiError_1.ApiError.notFound('Listing not found');
            return listing;
        });
    }
    /**
     * List all listings (Admin)
     */
    getListings(filters_1) {
        return __awaiter(this, arguments, void 0, function* (filters, pagination = {}) {
            return this.vehicleRepo.findSellerListings(filters, pagination);
        });
    }
    /**
     * Update listing status (Admin)
     */
    updateStatus(id, status, adminNotes, reviewedBy) {
        return __awaiter(this, void 0, void 0, function* () {
            const listing = yield this.vehicleRepo.findSellerById(id);
            if (!listing)
                throw ApiError_1.ApiError.notFound('Listing not found');
            return this.vehicleRepo.update(id, {
                status,
                adminNotes,
                reviewedBy,
                reviewedAt: new Date(),
            });
        });
    }
    /**
     * Update listing details (User/Admin)
     */
    updateListing(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const listing = yield this.vehicleRepo.findSellerById(id);
            if (!listing)
                throw ApiError_1.ApiError.notFound('Listing not found');
            return this.vehicleRepo.update(id, data);
        });
    }
    /**
     * Delete a listing
     */
    deleteListing(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const listing = yield this.vehicleRepo.findSellerById(id);
            if (!listing)
                throw ApiError_1.ApiError.notFound('Listing not found');
            yield this.vehicleRepo.hardDelete(id);
        });
    }
};
exports.SellerVehicleService = SellerVehicleService;
exports.SellerVehicleService = SellerVehicleService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.VehicleRepository)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.ProfileRepository)),
    __metadata("design:paramtypes", [VehicleRepository_1.VehicleRepository,
        ProfileRepository_1.ProfileRepository])
], SellerVehicleService);
