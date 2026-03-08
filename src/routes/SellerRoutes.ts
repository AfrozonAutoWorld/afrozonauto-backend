import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { SellerController } from '../controllers/SellerController';
import { registerSellerSchema, applyAsSellerSchema, verifySellerSchema } from "../validation/schema/seller.validation";
import { validateBody } from '../middleware/bodyValidate';
import { authenticate } from '../middleware/authMiddleware';

class SellerRoutes {
    private router: Router;
    private controller: SellerController;

    constructor() {
        this.router = Router();
        this.controller = container.get<SellerController>(TYPES.SellerController);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Public/User endpoints
        this.router.post('/register', validateBody(registerSellerSchema), this.controller.registerSeller);
        this.router.post('/apply', authenticate, validateBody(applyAsSellerSchema), this.controller.applyAsSeller);

        // Admin endpoints
        this.router.get('/applications', authenticate, this.controller.getApplications);
        this.router.patch('/applications/:id/verify', authenticate, validateBody(verifySellerSchema), this.controller.verifySeller);
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default new SellerRoutes().getRouter();
