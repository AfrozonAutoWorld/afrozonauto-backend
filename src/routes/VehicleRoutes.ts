import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { VehicleController } from '../controllers/VehicleController';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/bodyValidate';
import { createVehicleSchema } from '../validation/schema/vehicle.validation';



class VehicleRoutes {
    private router: Router;
    private controller: VehicleController;

    constructor() {
        this.router = Router();
        this.controller = container.get<VehicleController>(TYPES.VehicleController);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Public routes
        this.router.get('/', this.controller.getVehicles);
        this.router.get('/:identifier', this.controller.getVehicle);

        // Protected routes (require authentication)
        this.router.post('/', authenticate, validateBody(createVehicleSchema), this.controller.createVehicle);
        this.router.post('/sync/:vin', authenticate, this.controller.syncVehicle);
        this.router.post('/save-from-api', authenticate, this.controller.saveVehicleFromApi);
        this.router.put('/:id', authenticate, this.controller.updateVehicle);
        this.router.delete('/:id', authenticate, this.controller.deleteVehicle);
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default new VehicleRoutes().getRouter();
