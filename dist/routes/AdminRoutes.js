"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../config/inversify.config");
const types_1 = require("../config/types");
const authMiddleware_1 = require("../middleware/authMiddleware");
const enums_1 = require("../generated/prisma/enums");
const bodyValidate_1 = require("../middleware/bodyValidate");
const user_vallidation_1 = require("../validation/schema/user.vallidation");
const adminOnly = [
    authMiddleware_1.authenticate,
    (0, authMiddleware_1.authorize)([enums_1.UserRole.OPERATIONS_ADMIN, enums_1.UserRole.SUPER_ADMIN]),
];
class AdminRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.dashboardController = inversify_config_1.container.get(types_1.TYPES.AdminDashboardController);
        this.userController = inversify_config_1.container.get(types_1.TYPES.UserController);
        this.paymentController = inversify_config_1.container.get(types_1.TYPES.PaymentController);
        this.notificationController = inversify_config_1.container.get(types_1.TYPES.NotificationController);
        this.initializeRoutes();
    }
    initializeRoutes() {
        // ── Dashboard ──────────────────────────────────────────────────────────
        this.router.get('/dashboard/stats', ...adminOnly, this.dashboardController.getDashboardStats);
        this.router.get('/dashboard/pending-orders', ...adminOnly, this.dashboardController.getPendingOrders);
        this.router.get('/dashboard/recent-activity', ...adminOnly, this.dashboardController.getRecentActivity);
        // ── Users ──────────────────────────────────────────────────────────────
        this.router.get('/users', ...adminOnly, this.userController.getUsers);
        this.router.get('/users/:userId', ...adminOnly, this.userController.getUserById);
        this.router.post('/users/create', ...adminOnly, (0, bodyValidate_1.validateBody)(user_vallidation_1.createUserSchema), this.userController.adminCreateUser);
        this.router.delete('/users/:userId', ...adminOnly, this.userController.deactivateAccount);
        // ── Payments ───────────────────────────────────────────────────────────
        this.router.get('/payments/stats', ...adminOnly, this.paymentController.getPaymentStats);
        this.router.get('/payments', ...adminOnly, this.paymentController.getAdminPayments);
        this.router.get('/payments/:id', ...adminOnly, this.paymentController.getPaymentById);
        this.router.patch('/payments/:id/confirm', ...adminOnly, this.paymentController.confirmPayment);
        this.router.patch('/payments/:id/reject', ...adminOnly, this.paymentController.rejectPayment);
        // ── Notifications ──────────────────────────────────────────────────────
        this.router.get('/notifications/stats', ...adminOnly, this.notificationController.getStats);
        this.router.get('/notifications', ...adminOnly, this.notificationController.getNotifications);
        this.router.patch('/notifications/mark-all-read', ...adminOnly, this.notificationController.markAllAsRead);
        this.router.patch('/notifications/:id/read', ...adminOnly, this.notificationController.markAsRead);
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new AdminRoutes().getRouter();
