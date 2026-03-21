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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerVehicleController = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const SellerVehicleService_1 = require("../services/SellerVehicleService");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const client_1 = require("../generated/prisma/client");
const enumUtils_1 = require("../utils/enumUtils");
let SellerVehicleController = class SellerVehicleController {
    constructor(service) {
        this.service = service;
        /**
         * Submit a new vehicle listing (Public/Authenticated)
         */
        this.submitListing = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Map any old field names if necessary, but validation schema is already updated
            const _b = req.body, { uploadedFiles } = _b, data = __rest(_b, ["uploadedFiles"]);
            // Extract just the URLs from uploadedFiles
            // Extract URLs by file type
            const imageUrls = (uploadedFiles === null || uploadedFiles === void 0 ? void 0 : uploadedFiles.filter((file) => file.fileType === 'image').map((file) => file.url)) || [];
            const videoUrls = (uploadedFiles === null || uploadedFiles === void 0 ? void 0 : uploadedFiles.filter((file) => file.fileType === 'video').map((file) => file.url)) || [];
            // Get all URLs regardless of type
            const allUrls = (uploadedFiles === null || uploadedFiles === void 0 ? void 0 : uploadedFiles.map((file) => file.url)) || [];
            const listing = yield this.service.submitListing(Object.assign(Object.assign({}, data), { images: imageUrls, videos: videoUrls, userId: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || null, priceUsd: req.body.askingPrice }));
            return res.status(201).json(ApiResponse_1.ApiResponse.created(listing, 'Vehicle listing submitted for review'));
        }));
        /**
         * Get listing by ID
         */
        this.getListing = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const { id } = req.params;
            const listing = yield this.service.getListingById(id);
            // If not admin, check if it's the user's own listing
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.SUPER_ADMIN && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== client_1.UserRole.OPERATIONS_ADMIN) {
                if (listing.userId !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id)) {
                    throw ApiError_1.ApiError.forbidden('Access denied');
                }
            }
            return res.json(ApiResponse_1.ApiResponse.success(listing, 'Listing retrieved successfully'));
        }));
        /**
         * List listings with filters (Admin only)
         */
        this.getListings = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.SUPER_ADMIN && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== client_1.UserRole.OPERATIONS_ADMIN) {
                throw ApiError_1.ApiError.forbidden('Admin access required');
            }
            const filters = {
                status: (0, enumUtils_1.allowEnum)(req.query.status, client_1.VehicleStatus, 'status'),
                userId: req.query.userId,
                make: req.query.make,
                model: req.query.model,
                year: req.query.year ? parseInt(req.query.year, 10) : undefined,
            };
            const pagination = {
                page: req.query.page ? parseInt(req.query.page, 10) : 1,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
            };
            const result = yield this.service.getListings(filters, pagination);
            return res.json(ApiResponse_1.ApiResponse.paginated(result.listings, {
                page: pagination.page,
                limit: pagination.limit,
                total: result.total,
                pages: Math.ceil(result.total / pagination.limit),
            }, 'Listings retrieved successfully'));
        }));
        /**
         * Update listing status (Admin only)
         */
        this.updateStatus = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.SUPER_ADMIN && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== client_1.UserRole.OPERATIONS_ADMIN) {
                throw ApiError_1.ApiError.forbidden('Admin access required');
            }
            const { id } = req.params;
            const { status, adminNotes } = req.body;
            const listing = yield this.service.updateStatus(id, status, adminNotes, req.user.id);
            return res.json(ApiResponse_1.ApiResponse.success(listing, `Listing ${status.toLowerCase()} successfully`));
        }));
        /**
         * Delete listing (Owner or Admin)
         */
        this.deleteListing = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const { id } = req.params;
            const listing = yield this.service.getListingById(id);
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.SUPER_ADMIN && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== client_1.UserRole.OPERATIONS_ADMIN) {
                if (listing.userId !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id)) {
                    throw ApiError_1.ApiError.forbidden('Access denied');
                }
            }
            yield this.service.deleteListing(id);
            return res.json(ApiResponse_1.ApiResponse.success(null, 'Listing deleted successfully'));
        }));
    }
};
exports.SellerVehicleController = SellerVehicleController;
exports.SellerVehicleController = SellerVehicleController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.SellerVehicleService)),
    __metadata("design:paramtypes", [SellerVehicleService_1.SellerVehicleService])
], SellerVehicleController);
