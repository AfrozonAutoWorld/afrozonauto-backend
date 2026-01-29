"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../config/inversify.config");
const types_1 = require("../config/types");
const authMiddleware_1 = require("../middleware/authMiddleware");
const bodyValidate_1 = require("../middleware/bodyValidate");
const vehicle_validation_1 = require("../validation/schema/vehicle.validation");
class VehicleRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = inversify_config_1.container.get(types_1.TYPES.VehicleController);
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Public routes
        this.router.get('/', this.controller.getVehicles);
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
