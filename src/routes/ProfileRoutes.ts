import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { validateBody } from "../middleware/bodyValidate"
import { AuthController } from '../controllers/AuthController';
import {
    createUserSchema,
    TokenValidationSchema,
    forgotSchema,
    loginSchema,
    userVerifySchema,
    updateProfileSchema
} from '../validation/schema/user.vallidation';
import { uploadToCloudinary } from '../middleware/cloudinaryUploads';
import { upload } from '../config/multer.config';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { ProfileController } from '../controllers/ProfileController';
import { UserRole } from '../generated/prisma/enums';

class ProfileRoutes {
    private router = Router();
    private controller = container.get<ProfileController>(TYPES.ProfileController);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {

        // Create profile (authenticated)
        this.router.post(
            '/',
            authenticate,
            upload.array('files', 5),
            uploadToCloudinary,
            this.controller.create
        );
        // Get current authenticated user's profile
        this.router.get(
            '/me-profile',
            authenticate,
            this.controller.currentUserProfile
        );

        this.router.get(
            '/:id',
            authenticate,
            this.controller.getById
        );

        // Update current user's profile
        this.router.patch(
            '/',
            authenticate,
            upload.array('files', 5),
            uploadToCloudinary,
            validateBody(updateProfileSchema),
            this.controller.update
        );

        // Delete profile by ID (admin or owner – enforce in middleware/service)
        this.router.delete(
            '/:id',
            authenticate,
            authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]),
            this.controller.delete
        );

        // List all profiles (admin-only – enforce role in middleware)
        this.router.get(
            '/',
            authenticate,
            authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]),
            this.controller.list
        );



        // Reset password for current user
        this.router.post(
            '/reset-password',
            authenticate,
            this.controller.resetPassword
        );
    }

    public getRouter() {
        return this.router;
    }
}

export default new ProfileRoutes().getRouter();