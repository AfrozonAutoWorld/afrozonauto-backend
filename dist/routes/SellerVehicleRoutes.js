"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../config/inversify.config");
const types_1 = require("../config/types");
const seller_vehicle_validation_1 = require("../validation/schema/seller-vehicle.validation");
const bodyValidate_1 = require("../middleware/bodyValidate");
const authMiddleware_1 = require("../middleware/authMiddleware");
class SellerVehicleRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = inversify_config_1.container.get(types_1.TYPES.SellerVehicleController);
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Public/User endpoints
        this.router.post('/submit', authMiddleware_1.optionalAuthenticate, (0, bodyValidate_1.validateBody)(seller_vehicle_validation_1.createSellerVehicleSchema), this.controller.submitListing);
        this.router.get('/:id', authMiddleware_1.authenticate, this.controller.getListing);
        this.router.delete('/:id', authMiddleware_1.authenticate, this.controller.deleteListing);
        // Admin endpoints
        this.router.get('/', authMiddleware_1.authenticate, this.controller.getListings);
        this.router.patch('/:id/status', authMiddleware_1.authenticate, (0, bodyValidate_1.validateBody)(seller_vehicle_validation_1.updateSellerVehicleStatusSchema), this.controller.updateStatus);
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new SellerVehicleRoutes().getRouter();
