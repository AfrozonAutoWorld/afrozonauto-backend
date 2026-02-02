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
exports.OrderController = void 0;
const OrderService_1 = require("../services/OrderService");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const client_1 = require("../generated/prisma/client");
const asyncHandler_1 = require("../utils/asyncHandler");
const types_1 = require("../config/types");
const inversify_1 = require("inversify");
const VehicleService_1 = require("../services/VehicleService");
const ProfileService_1 = require("../services/ProfileService");
const AddressService_1 = require("../services/AddressService");
const PricingConfigRepository_1 = require("../repositories/PricingConfigRepository");
const PricingConfigService_1 = require("../services/PricingConfigService");
let OrderController = class OrderController {
    constructor(service, vehicleService, pricingRepo, pricingService, profileService, addressService) {
        this.service = service;
        this.vehicleService = vehicleService;
        this.pricingRepo = pricingRepo;
        this.pricingService = pricingService;
        this.profileService = profileService;
        this.addressService = addressService;
        // ========== CREATE ==========
        this.createOrder = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(401).json(ApiError_1.ApiError.unauthorized("Authentication required"));
            }
            const { vehicleId, shippingMethod, deliveryInstructions, customerNotes, specialRequests, tags, identifier, destinationCountry, destinationState, destinationCity, destinationAddress, type, } = req.body;
            const profile = yield this.profileService.findUserById(userId.toString());
            if (!profile) {
                return res.status(404).json(ApiError_1.ApiError.notFound('Profile not found. Please complete your profile first.'));
            }
            const address = yield this.addressService.getDefaultAddress(profile.id, client_1.AddressType.NORMAL);
            if (!address) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Default address required. Please set a default address.'));
            }
            const vehicle = yield this.vehicleService.getVehicle(identifier, type);
            if (!vehicle) {
                return res.status(404).json(ApiError_1.ApiError.notFound("vehicle not found"));
            }
            const vehiclePrice = (_b = vehicle.originalPriceUsd) !== null && _b !== void 0 ? _b : vehicle.priceUsd;
            const paymentBreakdown = yield this.pricingService.calculateTotalUsd(vehiclePrice, shippingMethod);
            const order = yield this.service.createOrder({
                userId,
                vehicleId,
                shippingMethod,
                // destinationCountry: address.country ?? undefined,
                // destinationState: address.state ?? undefined,
                // destinationCity: address.city ?? undefined,
                // destinationAddress: address.street ?? undefined,
                destinationCountry,
                destinationState,
                destinationCity,
                destinationAddress,
                deliveryInstructions,
                customerNotes,
                specialRequests,
                tags,
                vehicleSnapshot: vehicle,
                paymentBreakdown
            });
            return res.status(201).json(ApiResponse_1.ApiResponse.success(order, "Order created successfully"));
        }));
        this.orderSummary = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { identifier } = req.params;
            let raw = (_a = req.query) === null || _a === void 0 ? void 0 : _a.type;
            const shippingMethod = req.query.shippingMethod;
            if (!shippingMethod) {
                return res.status(400).json(ApiError_1.ApiError.badRequest("shippingMethod is required"));
            }
            const typeParam = (Array.isArray(raw) ? raw[0] : raw) || '';
            let type = (typeParam === null || typeParam === void 0 ? void 0 : typeParam.toString().trim().toLowerCase()) === 'vin' ? 'vin' : 'vin';
            if (identifier.startsWith('temp-')) {
                type = 'id';
            }
            if (!identifier) {
                return res.json(ApiError_1.ApiError.badRequest('Vehicle identifier is required'));
            }
            const vehicle = yield this.vehicleService.getVehicle(identifier, type);
            if (!vehicle) {
                return res.status(404).json(ApiError_1.ApiError.notFound("vehicle not found"));
            }
            const vehiclePrice = (_b = vehicle.originalPriceUsd) !== null && _b !== void 0 ? _b : vehicle.priceUsd;
            const pricingInformation = yield this.pricingRepo.getOrCreateSettings();
            const paymentBreakdown = yield this.pricingService.calculateTotalUsd(vehiclePrice, shippingMethod);
            return res.status(200).json(ApiResponse_1.ApiResponse.success({
                defaultPricing: pricingInformation,
                paymentBreakdown
            }));
        }));
        // ========== READ ==========
        this.getOrderById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const { id } = req.params;
            const order = yield this.service.getOrderById(id);
            // Check permissions
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'SUPER_ADMIN' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'OPERATIONS_ADMIN') {
                if (order.userId !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id)) {
                    throw new ApiError_1.ApiError(403, "Access denied");
                }
            }
            return res.status(200).json(ApiResponse_1.ApiResponse.success(order, "Order retrieved successfully"));
        }));
        this.getOrderByRequestNumber = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const { requestNumber } = req.params;
            const order = yield this.service.getOrderByRequestNumber(requestNumber);
            // Check permissions
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'SUPER_ADMIN' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'OPERATIONS_ADMIN') {
                if (order.userId !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id)) {
                    throw new ApiError_1.ApiError(403, "Access denied");
                }
            }
            return res.status(200).json(ApiResponse_1.ApiResponse.success(order, "Order retrieved successfully"));
        }));
        this.getUserOrders = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(401).json(ApiError_1.ApiError.unauthorized("Authentication required"));
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = yield this.service.getUserOrders(userId, page, limit);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(result, "User orders retrieved successfully"));
        }));
        // getAllOrders = asyncHandler(async (req: Request, res: Response) => {
        //   // Admin only
        //   if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
        //     throw new ApiError(403, "Admin access required");
        //   }
        //   const {
        //     status,
        //     userId,
        //     vehicleId,
        //     destinationCountry,
        //     destinationState,
        //     shippingMethod,
        //     priority,
        //     tags,
        //     startDate,
        //     endDate,
        //     search,
        //     isCancelled,
        //     isRefunded
        //   } = req.query;
        //   const page = parseInt(req.query.page as string) || 1;
        //   const limit = parseInt(req.query.limit as string) || 20;
        //   const filters = {
        //     status: status ? (Array.isArray(status) ? status : [status]) as OrderStatus[] : undefined,
        //     userId: userId as string,
        //     vehicleId: vehicleId as string,
        //     destinationCountry: destinationCountry as string,
        //     destinationState: destinationState as string,
        //     shippingMethod: shippingMethod as ShippingMethod,
        //     priority: priority as OrderPriority,
        //     tags: tags ? (Array.isArray(tags) ? tags : [tags]) as string[] : undefined,
        //     startDate: startDate ? new Date(startDate as string) : undefined,
        //     endDate: endDate ? new Date(endDate as string) : undefined,
        //     search: search as string,
        //     isCancelled: isCancelled ? isCancelled === 'true' : undefined,
        //     isRefunded: isRefunded ? isRefunded === 'true' : undefined
        //   };
        //   const result = await this.service.getAllOrders(filters, page, limit);
        //   return res.status(200).json(
        //     ApiResponse.success(result, "Orders retrieved successfully")
        //   );
        // });
        // ========== UPDATE ==========
        this.updateOrder = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const { id } = req.params;
            const order = yield this.service.getOrderById(id);
            // Check permissions
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'SUPER_ADMIN' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'OPERATIONS_ADMIN') {
                if (order.userId !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id)) {
                    throw new ApiError_1.ApiError(403, "Access denied");
                }
            }
            const { shippingMethod, destinationCountry, destinationState, destinationCity, destinationAddress, deliveryInstructions, customerNotes, specialRequests, estimatedDeliveryDate, priority, tags } = req.body;
            const updatedOrder = yield this.service.updateOrder(id, {
                shippingMethod,
                destinationCountry,
                destinationState,
                destinationCity,
                destinationAddress,
                deliveryInstructions,
                customerNotes,
                specialRequests,
                estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : undefined,
                priority,
                tags
            });
            return res.status(200).json(ApiResponse_1.ApiResponse.success(updatedOrder, "Order updated successfully"));
        }));
        this.updateOrderStatus = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Admin only
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'SUPER_ADMIN' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'OPERATIONS_ADMIN') {
                throw new ApiError_1.ApiError(403, "Admin access required");
            }
            const { id } = req.params;
            const { status } = req.body;
            if (!status || !Object.values(client_1.OrderStatus).includes(status)) {
                throw new ApiError_1.ApiError(400, "Invalid status");
            }
            const updatedOrder = yield this.service.updateOrderStatus(id, status, req.user.id);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(updatedOrder, "Order status updated successfully"));
        }));
        this.bulkUpdateOrderStatus = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Admin only
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'SUPER_ADMIN' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'OPERATIONS_ADMIN') {
                return res.status(400).json(ApiError_1.ApiError.unauthorized("Admin access required"));
            }
            const { ids, status } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json(ApiError_1.ApiError.notFound("IDs array is required"));
            }
            if (!status || !Object.values(client_1.OrderStatus).includes(status)) {
                return res.status(400).json(ApiError_1.ApiError.badRequest("Invalid status, kindly supply a valid status"));
            }
            const result = yield this.service.bulkUpdateOrderStatus(ids, status, req.user.id);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(result, "Orders status updated successfully"));
        }));
        this.updateOrderPriority = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Admin only
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'SUPER_ADMIN' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'OPERATIONS_ADMIN') {
                throw new ApiError_1.ApiError(403, "Admin access required");
            }
            const { id } = req.params;
            const { priority } = req.body;
            if (!priority || !Object.values(client_1.OrderPriority).includes(priority)) {
                throw new ApiError_1.ApiError(400, "Invalid priority");
            }
            const updatedOrder = yield this.service.updateOrderPriority(id, priority);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(updatedOrder, "Order priority updated successfully"));
        }));
        this.assignOrderTags = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Admin only
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'SUPER_ADMIN' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'OPERATIONS_ADMIN') {
                throw new ApiError_1.ApiError(403, "Admin access required");
            }
            const { id } = req.params;
            const { tags } = req.body;
            if (!tags || !Array.isArray(tags)) {
                throw new ApiError_1.ApiError(400, "Tags array is required");
            }
            const updatedOrder = yield this.service.assignOrderTags(id, tags);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(updatedOrder, "Order tags updated successfully"));
        }));
        this.cancelOrder = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const { id } = req.params;
            const { reason } = req.body;
            if (!reason) {
                return res.status(400).json(ApiError_1.ApiError.badRequest("Cancellation reason is required"));
            }
            const order = yield this.service.getOrderById(id);
            // Check permissions
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'SUPER_ADMIN' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'OPERATIONS_ADMIN') {
                if (order.userId !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id)) {
                    throw new ApiError_1.ApiError(403, "Access denied");
                }
            }
            const cancelledBy = ((_d = req.user) === null || _d === void 0 ? void 0 : _d.id) || 'system';
            const updatedOrder = yield this.service.cancelOrder(id, reason, cancelledBy);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(updatedOrder, "Order cancelled successfully"));
        }));
        this.requestRefund = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id } = req.params;
            const { reason } = req.body;
            if (!reason) {
                throw new ApiError_1.ApiError(400, "Refund reason is required");
            }
            const order = yield this.service.getOrderById(id);
            // Check permissions
            if (order.userId !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                throw new ApiError_1.ApiError(403, "Access denied");
            }
            const updatedOrder = yield this.service.requestRefund(id, reason);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(updatedOrder, "Refund requested successfully"));
        }));
        // ========== ADMIN OPERATIONS ==========
        this.addAdminNote = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Admin only
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'SUPER_ADMIN' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'OPERATIONS_ADMIN') {
                throw new ApiError_1.ApiError(403, "Admin access required");
            }
            const { id } = req.params;
            const { note, isInternal = true, category } = req.body;
            if (!note) {
                throw new ApiError_1.ApiError(400, "Note content is required");
            }
            const adminNote = yield this.service.addAdminNote(id, note, req.user.id, isInternal, category);
            return res.status(201).json(ApiResponse_1.ApiResponse.success(adminNote, "Admin note added successfully"));
        }));
        this.getAdminNotes = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Admin only
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'SUPER_ADMIN' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'OPERATIONS_ADMIN') {
                throw new ApiError_1.ApiError(403, "Admin access required");
            }
            const { id } = req.params;
            const notes = yield this.service.getAdminNotes(id);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(notes, "Admin notes retrieved successfully"));
        }));
        // ========== STATISTICS ==========
        // getOrderStats = asyncHandler(async (req: Request, res: Response) => {
        //   // Admin only
        //   if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'OPERATIONS_ADMIN') {
        //     throw new ApiError(403, "Admin access required");
        //   }
        //   const {
        //     startDate,
        //     endDate,
        //     destinationCountry,
        //     status
        //   } = req.query;
        //   const filters = {
        //     startDate: startDate ? new Date(startDate as string) : undefined,
        //     endDate: endDate ? new Date(endDate as string) : undefined,
        //     destinationCountry: destinationCountry as string,
        //     status: status as OrderStatus
        //   };
        //   const stats = await this.service.getOrderStats(filters);
        //   return res.status(200).json(
        //     ApiResponse.success(stats, "Order statistics retrieved successfully")
        //   );
        // });
        this.getStatusCounts = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Admin only
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'SUPER_ADMIN' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'OPERATIONS_ADMIN') {
                throw new ApiError_1.ApiError(403, "Admin access required");
            }
            const counts = yield this.service.getStatusCounts();
            return res.status(200).json(ApiResponse_1.ApiResponse.success(counts, "Status counts retrieved successfully"));
        }));
        this.getRevenueStats = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Admin only
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'SUPER_ADMIN' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'OPERATIONS_ADMIN') {
                throw new ApiError_1.ApiError(403, "Admin access required");
            }
            const { startDate, endDate } = req.query;
            const stats = yield this.service.getRevenueStats(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(stats, "Revenue statistics retrieved successfully"));
        }));
        // ========== DELETE ==========
        this.deleteOrder = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Admin only
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'SUPER_ADMIN') {
                throw new ApiError_1.ApiError(403, "Super admin access required");
            }
            const { id } = req.params;
            const success = yield this.service.delete(id);
            if (!success) {
                throw new ApiError_1.ApiError(404, "Order not found or already deleted");
            }
            return res.status(200).json(ApiResponse_1.ApiResponse.success(null, "Order deleted successfully"));
        }));
        this.softDeleteOrder = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Admin only
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'SUPER_ADMIN' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'OPERATIONS_ADMIN') {
                throw new ApiError_1.ApiError(403, "Admin access required");
            }
            const { id } = req.params;
            const order = yield this.service.softDelete(id);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(order, "Order cancelled (soft delete) successfully"));
        }));
    }
};
exports.OrderController = OrderController;
exports.OrderController = OrderController = __decorate([
    __param(0, (0, inversify_1.inject)(types_1.TYPES.OrderService)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.VehicleService)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.PricingConfigRepository)),
    __param(3, (0, inversify_1.inject)(types_1.TYPES.PricingConfigService)),
    __param(4, (0, inversify_1.inject)(types_1.TYPES.ProfileService)),
    __param(5, (0, inversify_1.inject)(types_1.TYPES.AddressService)),
    __metadata("design:paramtypes", [OrderService_1.OrderService,
        VehicleService_1.VehicleService,
        PricingConfigRepository_1.PricingConfigRepository,
        PricingConfigService_1.PricingConfigService,
        ProfileService_1.ProfileService,
        AddressService_1.AddressService])
], OrderController);
