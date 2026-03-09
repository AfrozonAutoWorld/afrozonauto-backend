import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { SellerController } from '../controllers/SellerController';
import { registerSellerSchema, applyAsSellerSchema, verifySellerSchema, checkEmailSchema, verifyTokenSchema } from "../validation/schema/seller.validation";
import { validateBody } from '../middleware/bodyValidate';
import { authenticate } from '../middleware/authMiddleware';
import { uploadToCloudinary } from '../middleware/cloudinaryUploads';
import { upload } from '../config/multer.config';

class SellerRoutes {
    private router: Router;
    private controller: SellerController;

    constructor() {
        this.router = Router();
        this.controller = container.get<SellerController>(TYPES.SellerController);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Guest flow: verify email then register
        this.router.post('/check-email', validateBody(checkEmailSchema), this.controller.checkSellerEmail);
        this.router.post('/verify-token', validateBody(verifyTokenSchema), this.controller.verifySellerEmail);
        this.router.post('/register', upload.array('files', 5), uploadToCloudinary, validateBody(registerSellerSchema), this.controller.registerSeller);

        // Existing user flow: authenticated application
        this.router.post('/apply', authenticate, upload.array('files', 5), uploadToCloudinary, validateBody(applyAsSellerSchema), this.controller.applyAsSeller);

        // Admin endpoints
        this.router.get('/applications', authenticate, this.controller.getApplications);
        this.router.patch('/applications/:id/verify', authenticate, validateBody(verifySellerSchema), this.controller.verifySeller);
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default new SellerRoutes().getRouter();
