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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var SellerVehicleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerVehicleService = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const VehicleRepository_1 = require("../repositories/VehicleRepository");
const ProfileRepository_1 = require("../repositories/ProfileRepository");
const client_1 = require("../generated/prisma/client");
const ApiError_1 = require("../utils/ApiError");
let SellerVehicleService = SellerVehicleService_1 = class SellerVehicleService {
    constructor(vehicleRepo, profileRepo) {
        this.vehicleRepo = vehicleRepo;
        this.profileRepo = profileRepo;
    }
    /**
     * Submit a new vehicle listing
     */
    submitListing(data, userRole) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const isAdmin = userRole === client_1.UserRole.SUPER_ADMIN || userRole === client_1.UserRole.OPERATIONS_ADMIN;
            if (!isAdmin && data.userId) {
                const profile = yield this.profileRepo.findUserById(data.userId);
                if (!profile || !profile.isSeller) {
                    throw ApiError_1.ApiError.forbidden('You must be a verified seller to list vehicles');
                }
            }
            // Admin-submitted vehicles go live immediately; seller submissions await review
            if (isAdmin) {
                data.status = client_1.VehicleStatus.AVAILABLE;
            }
            // additionalNotes (UI field) → manualNotes (Vehicle model field)
            if (data.additionalNotes !== undefined) {
                data.manualNotes = data.additionalNotes;
                delete data.additionalNotes;
            }
            // Generate a unique VIN placeholder if the seller doesn't know theirs
            if (!data.vin) {
                data.vin = SellerVehicleService_1.generateTempVin();
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
            if (!isAdmin) {
                data.status = client_1.VehicleStatus.PENDING_REVIEW;
            }
            try {
                return yield this.vehicleRepo.createSellerListing(data);
            }
            catch (err) {
                // P2002 on VIN means our placeholder collided — retry once with fresh VIN
                if ((err === null || err === void 0 ? void 0 : err.code) === 'P2002' && ((_b = (_a = err === null || err === void 0 ? void 0 : err.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.includes('vin'))) {
                    data.vin = SellerVehicleService_1.generateTempVin();
                    return this.vehicleRepo.createSellerListing(data);
                }
                throw err;
            }
        });
    }
    static generateTempVin() {
        const rand = () => Math.random().toString(36).substring(2, 8).toUpperCase();
        return `TEMP-${Date.now().toString(36).toUpperCase()}-${rand()}${rand()}`;
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
     * List seller-submitted vehicles for the authenticated user (dashboard).
     */
    getMyListings(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, pagination = {}) {
            return this.vehicleRepo.findSellerListings({ userId }, pagination);
        });
    }
    /**
     * Move a rejected seller listing back to pending review (seller resubmits).
     */
    markAsSold(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const listing = yield this.vehicleRepo.findSellerById(id);
            if (!listing)
                throw ApiError_1.ApiError.notFound('Listing not found');
            if (listing.userId !== userId)
                throw ApiError_1.ApiError.forbidden('Access denied');
            if (listing.source !== client_1.VehicleSource.SELLER) {
                throw ApiError_1.ApiError.badRequest('Only seller listings can be updated');
            }
            if (listing.status !== client_1.VehicleStatus.AVAILABLE) {
                throw ApiError_1.ApiError.badRequest('Only approved (live) listings can be marked as sold');
            }
            return this.vehicleRepo.update(id, { status: client_1.VehicleStatus.SOLD });
        });
    }
    /**
     * Seller updates their listing (same field set as submit).
     * - Rejected → pending review (clears rejection/admin review fields).
     * - Approved (live) or in admin review → pending review so the team can verify edits before the listing is live again.
     */
    updateMyListing(id, userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const listing = yield this.vehicleRepo.findSellerById(id);
            if (!listing)
                throw ApiError_1.ApiError.notFound('Listing not found');
            if (listing.userId !== userId)
                throw ApiError_1.ApiError.forbidden('Access denied');
            if (listing.source !== client_1.VehicleSource.SELLER) {
                throw ApiError_1.ApiError.badRequest('Only seller listings can be updated');
            }
            const editable = [
                client_1.VehicleStatus.PENDING_REVIEW,
                client_1.VehicleStatus.REJECTED,
                client_1.VehicleStatus.AVAILABLE,
                client_1.VehicleStatus.REVIEWING,
            ];
            if (!editable.includes(listing.status)) {
                throw ApiError_1.ApiError.badRequest('This listing cannot be edited in its current state');
            }
            const _a = data, { images, videos, askingPrice } = _a, rest = __rest(_a, ["images", "videos", "askingPrice"]);
            if (rest.additionalNotes !== undefined) {
                rest.manualNotes = rest.additionalNotes;
                delete rest.additionalNotes;
            }
            delete rest.existingImageUrls;
            delete rest.uploadedFiles;
            delete rest.userId;
            const updatePayload = Object.assign(Object.assign({}, rest), { images: images, videos: videos, priceUsd: askingPrice });
            if (listing.status === client_1.VehicleStatus.REJECTED) {
                updatePayload.status = client_1.VehicleStatus.PENDING_REVIEW;
                updatePayload.adminNotes = null;
                updatePayload.reviewedAt = null;
                updatePayload.reviewedBy = null;
            }
            else if (listing.status === client_1.VehicleStatus.AVAILABLE ||
                listing.status === client_1.VehicleStatus.REVIEWING) {
                updatePayload.status = client_1.VehicleStatus.PENDING_REVIEW;
                updatePayload.reviewedAt = null;
                updatePayload.reviewedBy = null;
            }
            return this.vehicleRepo.update(id, updatePayload);
        });
    }
    resubmitForReview(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const listing = yield this.vehicleRepo.findSellerById(id);
            if (!listing)
                throw ApiError_1.ApiError.notFound('Listing not found');
            if (listing.userId !== userId)
                throw ApiError_1.ApiError.forbidden('Access denied');
            if (listing.source !== client_1.VehicleSource.SELLER) {
                throw ApiError_1.ApiError.badRequest('Only seller listings can be resubmitted');
            }
            if (listing.status !== client_1.VehicleStatus.REJECTED) {
                throw ApiError_1.ApiError.badRequest('Only rejected listings can be resubmitted for review');
            }
            return this.vehicleRepo.update(id, {
                status: client_1.VehicleStatus.PENDING_REVIEW,
                reviewedAt: null,
                reviewedBy: null,
                adminNotes: null,
            });
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
exports.SellerVehicleService = SellerVehicleService = SellerVehicleService_1 = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.VehicleRepository)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.ProfileRepository)),
    __metadata("design:paramtypes", [VehicleRepository_1.VehicleRepository,
        ProfileRepository_1.ProfileRepository])
], SellerVehicleService);
