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
const SellerVehicleRepository_1 = require("../repositories/SellerVehicleRepository");
const ProfileRepository_1 = require("../repositories/ProfileRepository");
const client_1 = require("../generated/prisma/client");
const ApiError_1 = require("../utils/ApiError");
let SellerVehicleService = class SellerVehicleService {
    constructor(sellerRepo, profileRepo) {
        this.sellerRepo = sellerRepo;
        this.profileRepo = profileRepo;
    }
    /**
     * Submit a new vehicle listing
     */
    submitListing(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // If user is provided, check if they are a verified seller
            if (data.userId) {
                const profile = yield this.profileRepo.findUserById(data.userId);
                if (!profile || !profile.isSeller) {
                    throw ApiError_1.ApiError.forbidden('You must be a verified seller to list vehicles');
                }
            }
            // Set initial status for seller listings
            data.source = client_1.VehicleSource.SELLER;
            data.status = client_1.VehicleStatus.PENDING_REVIEW;
            return this.sellerRepo.create(data);
        });
    }
    /**
     * Get a listing by ID
     */
    getListingById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const listing = yield this.sellerRepo.findById(id);
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
            return this.sellerRepo.findMany(filters, pagination);
        });
    }
    /**
     * Update listing status (Admin)
     */
    updateStatus(id, status, adminNotes, reviewedBy) {
        return __awaiter(this, void 0, void 0, function* () {
            const listing = yield this.sellerRepo.findById(id);
            if (!listing)
                throw ApiError_1.ApiError.notFound('Listing not found');
            return this.sellerRepo.update(id, {
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
            const listing = yield this.sellerRepo.findById(id);
            if (!listing)
                throw ApiError_1.ApiError.notFound('Listing not found');
            // Logic to prevent editing if already approved/rejected could go here
            if (listing.status === client_1.VehicleStatus.AVAILABLE || listing.status === client_1.VehicleStatus.REJECTED) {
                // If it's AVAILABLE, it means it's already approved. 
                // In a real app, we might allow edits but they might require re-approval or just update the live listing.
                // For now let's keep it simple.
            }
            return this.sellerRepo.update(id, data);
        });
    }
    /**
     * Delete a listing
     */
    deleteListing(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const listing = yield this.sellerRepo.findById(id);
            if (!listing)
                throw ApiError_1.ApiError.notFound('Listing not found');
            yield this.sellerRepo.delete(id);
        });
    }
};
exports.SellerVehicleService = SellerVehicleService;
exports.SellerVehicleService = SellerVehicleService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.SellerVehicleRepository)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.ProfileRepository)),
    __metadata("design:paramtypes", [SellerVehicleRepository_1.SellerVehicleRepository,
        ProfileRepository_1.ProfileRepository])
], SellerVehicleService);
