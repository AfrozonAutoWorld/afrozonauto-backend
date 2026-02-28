import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { VehicleController } from '../controllers/VehicleController';
import { TrendingDefinitionController } from '../controllers/TrendingDefinitionController';
import { RecommendedDefinitionController } from '../controllers/RecommendedDefinitionController';
import { VehicleCategoryController } from '../controllers/VehicleCategoryController';
import { authenticate, authenticateOptional, authorize } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/bodyValidate';
import { createVehicleSchema } from '../validation/schema/vehicle.validation';
import { UserRole } from '../generated/prisma/client';

class VehicleRoutes {
    private router: Router;
    private controller: VehicleController;
    private trendingDefController: TrendingDefinitionController;
    private recommendedDefController: RecommendedDefinitionController;
    private categoryController: VehicleCategoryController;

    constructor() {
        this.router = Router();
        this.controller = container.get<VehicleController>(TYPES.VehicleController);
        this.trendingDefController = container.get<TrendingDefinitionController>(TYPES.TrendingDefinitionController);
        this.recommendedDefController = container.get<RecommendedDefinitionController>(TYPES.RecommendedDefinitionController);
        this.categoryController = container.get<VehicleCategoryController>(TYPES.VehicleCategoryController);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Public routes (order matters: specific paths before /:identifier)
        this.router.get('/', this.controller.getVehicles);
        this.router.get('/trending', this.controller.getTrending);
        this.router.get('/recommended', authenticateOptional, this.controller.getRecommended);
        this.router.get('/categories', this.controller.getCategories);
        this.router.get('/reference/models', this.controller.getMakeModelsReference);
        this.router.get('/debug/auto-dev-page', this.controller.getAutoDevPageDebug);

        // Saved vehicles (auth required; before /:identifier)
        this.router.get('/saved', authenticate, this.controller.getSavedVehicles);
        this.router.post('/saved', authenticate, this.controller.addSavedVehicle);
        this.router.delete('/saved/:vehicleId', authenticate, this.controller.removeSavedVehicle);

        // Admin: trending definitions (CRUD) - before /:identifier
        this.router.get('/trending-definitions', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN]), this.trendingDefController.list);
        this.router.get('/trending-definitions/:id', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN]), this.trendingDefController.getById);
        this.router.post('/trending-definitions', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN]), this.trendingDefController.create);
        this.router.put('/trending-definitions/:id', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN]), this.trendingDefController.update);
        this.router.delete('/trending-definitions/:id', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN]), this.trendingDefController.delete);

        // Admin: recommended definitions (CRUD)
        this.router.get('/recommended-definitions', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN]), this.recommendedDefController.list);
        this.router.get('/recommended-definitions/:id', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN]), this.recommendedDefController.getById);
        this.router.post('/recommended-definitions', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN]), this.recommendedDefController.create);
        this.router.put('/recommended-definitions/:id', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN]), this.recommendedDefController.update);
        this.router.delete('/recommended-definitions/:id', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN]), this.recommendedDefController.delete);

        // Admin: vehicle categories (CRUD)
        this.router.get('/admin/categories', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN]), this.categoryController.list);
        this.router.get('/admin/categories/:id', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN]), this.categoryController.getById);
        this.router.post('/admin/categories', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN]), this.categoryController.create);
        this.router.put('/admin/categories/:id', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN]), this.categoryController.update);
        this.router.delete('/admin/categories/:id', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN]), this.categoryController.delete);

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
