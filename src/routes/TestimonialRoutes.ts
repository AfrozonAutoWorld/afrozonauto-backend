import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { validateBody } from "../middleware/bodyValidate"

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
import { UserRole } from '../generated/prisma/enums';
import { TestimonialController } from '../controllers/TestimonialController';
import { createTestimonialSchema } from '../validation/schema/testimonial.vallidation';

class TestimonialRoutes {
    private router = Router();
    private controller = container.get<TestimonialController>(TYPES.TestimonialController);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {

        this.router.post(
            '/',
            authenticate,
            upload.array('files', 5),
            uploadToCloudinary,
            validateBody(createTestimonialSchema),
            this.controller.create
        );

        this.router.get(
            '/:id',
            authenticate,
            this.controller.getAllTestimonials
        );

        this.router.patch(
            '/',
            authenticate,
            authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]),
            this.controller.approve
        );

 
    }

    public getRouter() {
        return this.router;
    }
}

export default new TestimonialRoutes().getRouter();