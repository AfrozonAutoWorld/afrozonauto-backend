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
exports.VehicleController = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const VehicleService_1 = require("../services/VehicleService");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const client_1 = require("../generated/prisma/client");
let VehicleController = class VehicleController {
    constructor(vehicleService) {
        this.vehicleService = vehicleService;
        /**
         * GET /api/vehicles
         * Get list of vehicles with filters (DB first, Redis cache, API fallback)
         * Query param: includeApi=true/false (default: true) - whether to include API results
         * API results are cached in Redis (12hr TTL) to handle price changes
         */
        this.getVehicles = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const q = req.query;
            const str = (v) => {
                const s = Array.isArray(v) ? v[0] : v;
                return typeof s === 'string' && s.trim() !== '' ? s.trim() : undefined;
            };
            const filters = {};
            if (str(q.make))
                filters.make = str(q.make);
            if (str(q.model))
                filters.model = str(q.model);
            const yearMin = q.yearMin ? parseInt(q.yearMin, 10) : undefined;
            const yearMax = q.yearMax ? parseInt(q.yearMax, 10) : undefined;
            if (Number.isFinite(yearMin))
                filters.yearMin = yearMin;
            if (Number.isFinite(yearMax))
                filters.yearMax = yearMax;
            const priceMin = q.priceMin ? parseFloat(q.priceMin) : undefined;
            const priceMax = q.priceMax ? parseFloat(q.priceMax) : undefined;
            if (Number.isFinite(priceMin))
                filters.priceMin = priceMin;
            if (Number.isFinite(priceMax))
                filters.priceMax = priceMax;
            const mileageMax = q.mileageMax ? parseInt(q.mileageMax, 10) : undefined;
            if (Number.isFinite(mileageMax))
                filters.mileageMax = mileageMax;
            if (str(q.vehicleType))
                filters.vehicleType = str(q.vehicleType);
            if (str(q.status))
                filters.status = str(q.status);
            if (str(q.state))
                filters.dealerState = str(q.state);
            if (q.featured !== undefined && q.featured !== '')
                filters.featured = q.featured === 'true';
            if (str(q.search))
                filters.search = str(q.search);
            const pagination = {
                page: Math.max(1, q.page ? parseInt(q.page, 10) : 1),
                limit: Math.min(100, Math.max(1, q.limit ? parseInt(q.limit, 10) : 50)),
            };
            const includeApi = req.query.includeApi !== 'false';
            const result = yield this.vehicleService.getVehicles(filters, pagination, includeApi);
            return res.json(ApiResponse_1.ApiResponse.paginated(result.vehicles, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                pages: result.pages,
                fromApi: result.fromApi || 0,
            }, 'Vehicles retrieved successfully'));
        }));
        /**
         * GET /api/vehicles/:identifier
         * Get vehicle by ID or VIN
         * Query param: type="id" | "vin" (default: "id")
         * Flow:
         *   - type="id": DB → Redis → API
         *   - type="vin": Redis → API
         * Does NOT save to DB - only returns cached/API data
         */
        this.getVehicle = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { identifier } = req.params;
            let raw = (_a = req.query) === null || _a === void 0 ? void 0 : _a.type;
            const typeParam = (Array.isArray(raw) ? raw[0] : raw) || '';
            let type = (typeParam === null || typeParam === void 0 ? void 0 : typeParam.toString().trim().toLowerCase()) === 'vin' ? 'vin' : 'vin';
            if (identifier.startsWith('temp-')) {
                type = 'id';
            }
            if (!identifier) {
                return res.json(ApiError_1.ApiError.badRequest('Vehicle identifier is required'));
            }
            const vehicle = yield this.vehicleService.getVehicle(identifier, type);
            return res.json(ApiResponse_1.ApiResponse.success(vehicle, 'Vehicle retrieved successfully'));
        }));
        /**
         * POST /api/vehicles
         * Create vehicle (Admin only)
         */
        this.createVehicle = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.SUPER_ADMIN && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== client_1.UserRole.OPERATIONS_ADMIN) {
                throw ApiError_1.ApiError.forbidden('Only admins can create vehicles');
            }
            const vehicle = yield this.vehicleService.createVehicle(req.body, (_c = req.user) === null || _c === void 0 ? void 0 : _c.id);
            return res.status(201).json(ApiResponse_1.ApiResponse.created(vehicle, 'Vehicle created successfully'));
        }));
        /**
         * POST /api/vehicles/sync/:vin
         * Sync vehicle from Auto.dev API
         */
        this.syncVehicle = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { vin } = req.params;
            if (!vin || vin.length !== 17) {
                throw ApiError_1.ApiError.badRequest('Invalid VIN. Must be 17 characters');
            }
            const vehicle = yield this.vehicleService.syncFromAutoDev(vin);
            return res.json(ApiResponse_1.ApiResponse.success(vehicle, 'Vehicle synced successfully'));
        }));
        /**
         * PUT /api/vehicles/:id
         * Update vehicle (Admin only)
         */
        this.updateVehicle = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.SUPER_ADMIN && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== client_1.UserRole.OPERATIONS_ADMIN) {
                throw ApiError_1.ApiError.forbidden('Only admins can update vehicles');
            }
            const { id } = req.params;
            const vehicle = yield this.vehicleService.updateVehicle(id, req.body);
            res.json(ApiResponse_1.ApiResponse.success(vehicle, 'Vehicle updated successfully'));
        }));
        /**
         * DELETE /api/vehicles/:id
         * Delete vehicle (Admin only)
         */
        this.deleteVehicle = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.UserRole.SUPER_ADMIN && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== client_1.UserRole.OPERATIONS_ADMIN) {
                throw ApiError_1.ApiError.forbidden('Only admins can delete vehicles');
            }
            const { id } = req.params;
            yield this.vehicleService.deleteVehicle(id);
            return res.json(ApiResponse_1.ApiResponse.success(null, 'Vehicle deleted successfully'));
        }));
        /**
         * POST /api/vehicles/save-from-api
         * Save a vehicle from Auto.dev API to DB (called when user initiates payment)
         * This is the ONLY endpoint that saves API vehicles to DB
         * Body: { vin, listing, photos?, specs? }
         */
        this.saveVehicleFromApi = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { vin, listing, photos, specs } = req.body;
            if (!vin || !listing) {
                throw ApiError_1.ApiError.badRequest('VIN and listing are required');
            }
            const vehicle = yield this.vehicleService.saveVehicleFromApiListing(listing, photos || [], specs);
            return res.status(201).json(ApiResponse_1.ApiResponse.created(vehicle, 'Vehicle saved from API successfully'));
        }));
    }
};
exports.VehicleController = VehicleController;
exports.VehicleController = VehicleController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.VehicleService)),
    __metadata("design:paramtypes", [VehicleService_1.VehicleService])
], VehicleController);
