"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../config/inversify.config");
const types_1 = require("../config/types");
const authMiddleware_1 = require("../middleware/authMiddleware");
const bodyValidate_1 = require("../middleware/bodyValidate");
const vehicle_validation_1 = require("../validation/schema/vehicle.validation");
const router = (0, express_1.Router)();
const vehicleController = inversify_config_1.container.get(types_1.TYPES.VehicleController);
// Public routes
router.get('/', vehicleController.getVehicles);
router.get('/:identifier', vehicleController.getVehicle);
// Protected routes (require authentication)
router.post('/', authMiddleware_1.authenticate, (0, bodyValidate_1.validateBody)(vehicle_validation_1.createVehicleSchema), vehicleController.createVehicle);
router.post('/sync/:vin', authMiddleware_1.authenticate, vehicleController.syncVehicle);
router.post('/save-from-api', authMiddleware_1.authenticate, vehicleController.saveVehicleFromApi);
router.put('/:id', authMiddleware_1.authenticate, vehicleController.updateVehicle);
router.delete('/:id', authMiddleware_1.authenticate, vehicleController.deleteVehicle);
exports.default = router;
