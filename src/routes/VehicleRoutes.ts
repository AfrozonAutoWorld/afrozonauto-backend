import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { VehicleController } from '../controllers/VehicleController';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/bodyValidate';
import { createVehicleSchema } from '../validation/schema/vehicle.validation';

const router = Router();
const vehicleController = container.get<VehicleController>(TYPES.VehicleController);

// Public routes
router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicleById);

// Protected routes (require authentication)
router.post('/', authenticate, validateBody(createVehicleSchema), vehicleController.createVehicle);
router.post('/sync/:vin', authenticate, vehicleController.syncVehicle);
router.post('/save-from-api', authenticate, vehicleController.saveVehicleFromApi);
router.put('/:id', authenticate, vehicleController.updateVehicle);
router.delete('/:id', authenticate, vehicleController.deleteVehicle);

export default router;

