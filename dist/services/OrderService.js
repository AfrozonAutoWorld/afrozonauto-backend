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
exports.OrderService = void 0;
const inversify_1 = require("inversify");
const OrderRepository_1 = require("../repositories/OrderRepository");
const client_1 = require("../generated/prisma/client");
const types_1 = require("../config/types");
const ApiError_1 = require("../utils/ApiError");
let OrderService = class OrderService {
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }
    // ========== CREATE ==========
    createOrder(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Generate request number
            const requestNumber = this.generateRequestNumber();
            const orderData = Object.assign(Object.assign({ requestNumber, user: { connect: { id: data.userId } } }, (data.vehicleId && {
                vehicle: { connect: { id: data.vehicleId } }
            })), { shippingMethod: data.shippingMethod, destinationCountry: data.destinationCountry || "Nigeria", destinationState: data.destinationState, destinationCity: data.destinationCity, destinationAddress: data.destinationAddress, deliveryInstructions: data.deliveryInstructions, customerNotes: data.customerNotes, specialRequests: data.specialRequests, tags: data.tags || [], status: client_1.OrderStatus.PENDING_QUOTE, vehicleSnapshot: data.vehicleSnapshot, paymentBreakdown: data.paymentBreakdown });
            return this.orderRepository.create(orderData);
        });
    }
    generateRequestNumber() {
        const year = new Date().getFullYear().toString().slice(-2);
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(100000 + Math.random() * 900000);
        return `AFZ-${year}-${month}-${random}`;
    }
    // ========== READ ==========
    getOrderById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.orderRepository.findById(id);
            if (!order) {
                throw new ApiError_1.ApiError(404, "Order not found");
            }
            return order;
        });
    }
    getOrderByRequestNumber(requestNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.orderRepository.findByRequestNumber(requestNumber);
            if (!order) {
                throw new ApiError_1.ApiError(404, "Order not found");
            }
            return order;
        });
    }
    getUserOrders(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 10) {
            return this.orderRepository.findByUserId(userId, page, limit);
        });
    }
    getVehicleOrders(vehicleId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.orderRepository.findByVehicleId(vehicleId);
        });
    }
    // async getAllOrders(filters: OrderFilters, page = 1, limit = 20): Promise<{
    //   orders: Order[];
    //   total: number;
    //   page: number;
    //   limit: number;
    //   totalPages: number;
    //   stats: OrderStats;
    // }> {
    //   return this.orderRepository.findAllWithFilters(filters, page, limit);
    // }
    // delete order
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.getOrderById(id);
            // Check if order can be modified
            if (!order) {
                throw ApiError_1.ApiError.notFound("Order not found");
            }
            return this.orderRepository.delete(id);
        });
    }
    softDelete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.getOrderById(id);
            // Check if order can be modified
            if (!order) {
                throw ApiError_1.ApiError.notFound("Order not found");
            }
            return this.orderRepository.softDelete(id);
        });
    }
    // ========== UPDATE ==========
    updateOrder(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.getOrderById(id);
            // Check if order can be modified
            if (this.isOrderLocked(order)) {
                throw new ApiError_1.ApiError(400, "Order cannot be modified in its current state");
            }
            return this.orderRepository.update(id, data);
        });
    }
    updateOrderStatus(id, status, adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.getOrderById(id);
            // Validate status transition
            if (!this.isValidStatusTransition(order.status, status)) {
                throw new ApiError_1.ApiError(400, `Invalid status transition from ${order.status} to ${status}`);
            }
            return this.orderRepository.updateStatus(id, status, adminId);
        });
    }
    bulkUpdateOrderStatus(ids, status, adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate all orders exist
            const orders = yield Promise.all(ids.map(id => this.orderRepository.findById(id)));
            const invalidOrders = orders.filter(order => !order);
            if (invalidOrders.length > 0) {
                throw new ApiError_1.ApiError(404, `Some orders not found`);
            }
            // Validate status transitions
            for (const order of orders) {
                if (order && !this.isValidStatusTransition(order.status, status)) {
                    throw new ApiError_1.ApiError(400, `Order ${order.requestNumber} cannot transition from ${order.status} to ${status}`);
                }
            }
            return this.orderRepository.bulkUpdateStatus(ids, status, adminId);
        });
    }
    updateOrderPriority(id, priority) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.orderRepository.updatePriority(id, priority);
        });
    }
    assignOrderTags(id, tags) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.orderRepository.assignTags(id, tags);
        });
    }
    cancelOrder(id, reason, cancelledBy) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.getOrderById(id);
            // Check if order can be cancelled
            if (!this.canCancelOrder(order)) {
                throw new ApiError_1.ApiError(400, "Order cannot be cancelled in its current state");
            }
            return this.orderRepository.update(id, {
                status: client_1.OrderStatus.CANCELLED,
                cancelledAt: new Date(),
                cancelledBy,
                cancellationReason: reason
            });
        });
    }
    requestRefund(id, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.getOrderById(id);
            // Check if refund can be requested
            if (!order.cancelledAt) {
                throw new ApiError_1.ApiError(400, "Order must be cancelled before requesting refund");
            }
            if (order.refundRequested) {
                throw new ApiError_1.ApiError(400, "Refund already requested for this order");
            }
            return this.orderRepository.update(id, {
                refundRequested: true
            });
        });
    }
    // ========== ADMIN OPERATIONS ==========
    addAdminNote(orderId_1, note_1, adminId_1) {
        return __awaiter(this, arguments, void 0, function* (orderId, note, adminId, isInternal = true, category) {
            return this.orderRepository.addAdminNote(orderId, note, adminId, isInternal, category);
        });
    }
    getAdminNotes(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.orderRepository.getAdminNotes(orderId);
        });
    }
    // ========== STATISTICS ==========
    // async getOrderStats(filters?: Partial<OrderFilters>): Promise<OrderStats> {
    //   return this.orderRepository.getOrderStats(filters);
    // }
    getStatusCounts() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.orderRepository.getStatusCounts();
        });
    }
    getRevenueStats(startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.orderRepository.getRevenueStats(startDate, endDate);
        });
    }
    // ========== VALIDATION HELPERS ==========
    isOrderLocked(order) {
        // Explicitly type the array to include all OrderStatus values
        const lockedStatuses = [
            client_1.OrderStatus.CANCELLED,
            client_1.OrderStatus.REFUNDED,
            client_1.OrderStatus.DELIVERED,
            client_1.OrderStatus.SHIPPED,
            client_1.OrderStatus.PURCHASED
        ];
        return lockedStatuses.includes(order.status);
    }
    canCancelOrder(order) {
        // Explicitly type the array to include all OrderStatus values
        const cancellableStatuses = [
            client_1.OrderStatus.PENDING_QUOTE,
            client_1.OrderStatus.QUOTE_SENT,
            client_1.OrderStatus.QUOTE_ACCEPTED,
            client_1.OrderStatus.DEPOSIT_PENDING,
            client_1.OrderStatus.INSPECTION_PENDING,
            client_1.OrderStatus.AWAITING_APPROVAL
        ];
        return cancellableStatuses.includes(order.status);
    }
    isValidStatusTransition(from, to) {
        var _a;
        // Define valid transitions
        const validTransitions = {
            [client_1.OrderStatus.PENDING_QUOTE]: [client_1.OrderStatus.QUOTE_SENT, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.QUOTE_SENT]: [client_1.OrderStatus.QUOTE_ACCEPTED, client_1.OrderStatus.QUOTE_REJECTED, client_1.OrderStatus.QUOTE_EXPIRED, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.QUOTE_ACCEPTED]: [client_1.OrderStatus.DEPOSIT_PENDING, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.DEPOSIT_PENDING]: [client_1.OrderStatus.DEPOSIT_PAID, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.HALF_DEPOSIT_PAID]: [client_1.OrderStatus.BALANCE_PAID, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.BALANCE_PAID]: [client_1.OrderStatus.BALANCE_PAID, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.AWAITING_BALANCE]: [client_1.OrderStatus.BALANCE_PAID, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.DEPOSIT_PAID]: [client_1.OrderStatus.INSPECTION_PENDING, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.INSPECTION_PENDING]: [client_1.OrderStatus.INSPECTION_COMPLETE, client_1.OrderStatus.INSPECTION_FAILED, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.INSPECTION_COMPLETE]: [client_1.OrderStatus.AWAITING_APPROVAL, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.INSPECTION_FAILED]: [client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.AWAITING_APPROVAL]: [client_1.OrderStatus.APPROVED, client_1.OrderStatus.REJECTED, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.APPROVED]: [client_1.OrderStatus.PURCHASE_IN_PROGRESS, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.REJECTED]: [client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.PURCHASE_IN_PROGRESS]: [client_1.OrderStatus.PURCHASED, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.PURCHASED]: [client_1.OrderStatus.EXPORT_PENDING],
            [client_1.OrderStatus.EXPORT_PENDING]: [client_1.OrderStatus.SHIPPED],
            [client_1.OrderStatus.SHIPPED]: [client_1.OrderStatus.IN_TRANSIT],
            [client_1.OrderStatus.IN_TRANSIT]: [client_1.OrderStatus.ARRIVED_PORT],
            [client_1.OrderStatus.ARRIVED_PORT]: [client_1.OrderStatus.CUSTOMS_CLEARANCE, client_1.OrderStatus.CUSTOMS_HOLD],
            [client_1.OrderStatus.CUSTOMS_CLEARANCE]: [client_1.OrderStatus.CLEARED],
            [client_1.OrderStatus.CUSTOMS_HOLD]: [client_1.OrderStatus.CLEARED],
            [client_1.OrderStatus.CLEARED]: [client_1.OrderStatus.DELIVERY_SCHEDULED],
            [client_1.OrderStatus.DELIVERY_SCHEDULED]: [client_1.OrderStatus.OUT_FOR_DELIVERY],
            [client_1.OrderStatus.OUT_FOR_DELIVERY]: [client_1.OrderStatus.DELIVERED],
            [client_1.OrderStatus.DELIVERED]: [],
            [client_1.OrderStatus.CANCELLED]: [],
            [client_1.OrderStatus.REFUNDED]: [],
            [client_1.OrderStatus.PARTIALLY_REFUNDED]: [],
            [client_1.OrderStatus.QUOTE_REJECTED]: [],
            [client_1.OrderStatus.QUOTE_EXPIRED]: []
        };
        return ((_a = validTransitions[from]) === null || _a === void 0 ? void 0 : _a.includes(to)) || false;
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.OrderRepository)),
    __metadata("design:paramtypes", [OrderRepository_1.OrderRepository])
], OrderService);
