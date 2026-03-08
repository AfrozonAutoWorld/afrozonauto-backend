import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { SellerVehicleController } from '../controllers/SellerVehicleController';
import { createSellerVehicleSchema, updateSellerVehicleStatusSchema } from "../validation/schema/seller-vehicle.validation";
import { validateBody } from '../middleware/bodyValidate';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';

class SellerVehicleRoutes {
    private router: Router;
    private controller: SellerVehicleController;

    constructor() {
        this.router = Router();
        this.controller = container.get<SellerVehicleController>(TYPES.SellerVehicleController);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Public/User endpoints
        this.router.post('/submit', optionalAuthenticate, validateBody(createSellerVehicleSchema), this.controller.submitListing);
        this.router.get('/:id', authenticate, this.controller.getListing);
        this.router.delete('/:id', authenticate, this.controller.deleteListing);

        // Admin endpoints
        this.router.get('/', authenticate, this.controller.getListings);
        this.router.patch('/:id/status', authenticate, validateBody(updateSellerVehicleStatusSchema), this.controller.updateStatus);
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default new SellerVehicleRoutes().getRouter();
