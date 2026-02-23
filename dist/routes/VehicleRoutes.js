"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../config/inversify.config");
const types_1 = require("../config/types");
const authMiddleware_1 = require("../middleware/authMiddleware");
const bodyValidate_1 = require("../middleware/bodyValidate");
const vehicle_validation_1 = require("../validation/schema/vehicle.validation");
const client_1 = require("../generated/prisma/client");
class VehicleRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = inversify_config_1.container.get(types_1.TYPES.VehicleController);
        this.trendingDefController = inversify_config_1.container.get(types_1.TYPES.TrendingDefinitionController);
        this.categoryController = inversify_config_1.container.get(types_1.TYPES.VehicleCategoryController);
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Public routes (order matters: specific paths before /:identifier)
        this.router.get('/', this.controller.getVehicles);
        this.router.get('/trending', this.controller.getTrending);
        this.router.get('/categories', this.controller.getCategories);
        // Admin: trending definitions (CRUD) - before /:identifier
        this.router.get('/trending-definitions', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS_ADMIN]), this.trendingDefController.list);
        this.router.get('/trending-definitions/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS_ADMIN]), this.trendingDefController.getById);
        this.router.post('/trending-definitions', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS_ADMIN]), this.trendingDefController.create);
        this.router.put('/trending-definitions/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS_ADMIN]), this.trendingDefController.update);
        this.router.delete('/trending-definitions/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS_ADMIN]), this.trendingDefController.delete);
        // Admin: vehicle categories (CRUD)
        this.router.get('/admin/categories', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS_ADMIN]), this.categoryController.list);
        this.router.get('/admin/categories/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS_ADMIN]), this.categoryController.getById);
        this.router.post('/admin/categories', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS_ADMIN]), this.categoryController.create);
        this.router.put('/admin/categories/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS_ADMIN]), this.categoryController.update);
        this.router.delete('/admin/categories/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS_ADMIN]), this.categoryController.delete);
        this.router.get('/:identifier', this.controller.getVehicle);
        // Protected routes (require authentication)
        this.router.post('/', authMiddleware_1.authenticate, (0, bodyValidate_1.validateBody)(vehicle_validation_1.createVehicleSchema), this.controller.createVehicle);
        this.router.post('/sync/:vin', authMiddleware_1.authenticate, this.controller.syncVehicle);
        this.router.post('/save-from-api', authMiddleware_1.authenticate, this.controller.saveVehicleFromApi);
        this.router.put('/:id', authMiddleware_1.authenticate, this.controller.updateVehicle);
        this.router.delete('/:id', authMiddleware_1.authenticate, this.controller.deleteVehicle);
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new VehicleRoutes().getRouter();
