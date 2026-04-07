import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { SellerVehicleController } from '../controllers/SellerVehicleController';
import { createSellerVehicleSchema, updateSellerVehicleStatusSchema } from "../validation/schema/seller-vehicle.validation";
import { validateBody } from '../middleware/bodyValidate';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';
import { upload } from '../config/multer.config';
import { uploadToCloudinary } from '../middleware/cloudinaryUploads';

class SellerVehicleRoutes {
    private router: Router;
    private controller: SellerVehicleController;

    constructor() {
        this.router = Router();
        this.controller = container.get<SellerVehicleController>(TYPES.SellerVehicleController);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Seller dashboard list — use /me/listings (two segments) so it can never match `GET /:id`.
        // (Single-segment /my-listings was mistaken for an ObjectId when static route order/build was stale.)
        this.router.get('/me/listings', authenticate, this.controller.getMyListings);
        this.router.post('/:id/resubmit', authenticate, this.controller.resubmitForReview);

        // Public/User endpoints
        this.router.post('/submit', 
            optionalAuthenticate,
            upload.array('files', 10),
            uploadToCloudinary, 
            validateBody(createSellerVehicleSchema),
            this.controller.submitListing);

        this.router.patch(
            '/:id/mark-sold',
            authenticate,
            this.controller.markAsSold,
        );
        this.router.patch(
            '/:id',
            authenticate,
            upload.array('files', 10),
            uploadToCloudinary,
            validateBody(createSellerVehicleSchema),
            this.controller.updateMyListing,
        );

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
