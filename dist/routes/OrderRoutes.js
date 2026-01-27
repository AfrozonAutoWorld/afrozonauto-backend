"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../config/inversify.config");
const types_1 = require("../config/types");
const bodyValidate_1 = require("../middleware/bodyValidate");
const order_validation_1 = require("../validation/schema/order.validation");
const authMiddleware_1 = require("../middleware/authMiddleware");
const enums_1 = require("../generated/prisma/enums");
class OrderRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = inversify_config_1.container.get(types_1.TYPES.OrderController);
        this.initializeRoutes();
    }
    initializeRoutes() {
        // ========== PUBLIC USER ROUTES ==========
        // Create order
        this.router.post('/', (0, bodyValidate_1.validateBody)(order_validation_1.createOrderSchema), this.controller.createOrder);
        // Get user's orders
        this.router.get('/my-orders', this.controller.getUserOrders);
        // Get specific order by ID
        this.router.get('/:id', this.controller.getOrderById);
        // Get order by request number
        this.router.get('/request/:requestNumber', this.controller.getOrderByRequestNumber);
        // Cancel order
        this.router.post('/:id/cancel', (0, bodyValidate_1.validateBody)(order_validation_1.cancelOrder), this.controller.cancelOrder);
        // Request refund
        this.router.post('/:id/request-refund', (0, bodyValidate_1.validateBody)(order_validation_1.cancelOrder), this.controller.requestRefund);
        // Update order (limited fields for users)
        this.router.put('/:id', (0, bodyValidate_1.validateBody)(order_validation_1.updateOrderSchema), this.controller.updateOrder);
        // ========== ADMIN ROUTES ==========
        this.router.use((0, authMiddleware_1.authorize)([]));
        // Get all orders with filters
        // this.router.get('/', this.controller.getAllOrders);
        // Update order status
        this.router.put('/:id/status', (0, authMiddleware_1.authorize)([enums_1.UserRole.OPERATIONS_ADMIN, enums_1.UserRole.SUPER_ADMIN]), this.controller.updateOrderStatus);
        // Bulk update order status
        this.router.put('/bulk/status', (0, authMiddleware_1.authorize)([enums_1.UserRole.OPERATIONS_ADMIN, enums_1.UserRole.SUPER_ADMIN]), this.controller.bulkUpdateOrderStatus);
        // Update order priority
        this.router.put('/:id/priority', (0, authMiddleware_1.authorize)([enums_1.UserRole.OPERATIONS_ADMIN, enums_1.UserRole.SUPER_ADMIN]), this.controller.updateOrderPriority);
        // Assign tags
        this.router.put('/:id/tags', (0, authMiddleware_1.authorize)([enums_1.UserRole.OPERATIONS_ADMIN, enums_1.UserRole.SUPER_ADMIN]), this.controller.assignOrderTags);
        // Add admin note
        this.router.post('/:id/notes', (0, authMiddleware_1.authorize)([enums_1.UserRole.OPERATIONS_ADMIN, enums_1.UserRole.SUPER_ADMIN]), (0, bodyValidate_1.validateBody)(order_validation_1.AdminNoteSchema), this.controller.addAdminNote);
        // Get admin notes
        this.router.get('/:id/notes', (0, authMiddleware_1.authorize)([enums_1.UserRole.OPERATIONS_ADMIN, enums_1.UserRole.SUPER_ADMIN]), this.controller.getAdminNotes);
        // ========== STATISTICS ROUTES ==========
        // Order statistics
        // this.router.get('/stats/orders', this.controller.getOrderStats);
        // Status counts
        this.router.get('/stats/status-counts', this.controller.getStatusCounts);
        // Revenue statistics
        this.router.get('/stats/revenue', this.controller.getRevenueStats);
        // ========== SUPER ADMIN ROUTES ==========
        // Delete order permanently
        this.router.delete('/:id', (0, authMiddleware_1.authorize)([enums_1.UserRole.SUPER_ADMIN]), this.controller.deleteOrder);
        // Soft delete order
        this.router.delete('/:id/soft', (0, authMiddleware_1.authorize)([enums_1.UserRole.SUPER_ADMIN]), this.controller.softDeleteOrder);
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new OrderRoutes().getRouter();
