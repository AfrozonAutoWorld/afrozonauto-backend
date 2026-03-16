import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../generated/prisma/enums';
import { UserController } from '../controllers/UserController';
import { validateBody } from '../middleware/bodyValidate';
import { createUserSchema } from '../validation/schema/user.vallidation';

class UserRoutes {
    private router = Router();
    private controller = container.get<UserController>(TYPES.UserController);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(
            '/user-email/:email',
            authenticate,
            this.controller.getUserByEmail
        );
        this.router.get(
            '/',
            authenticate,
            authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]),
            this.controller.getUsers
        );
        this.router.delete(
            '/user-deactivate/:userId',
            authenticate,
            authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]),
            this.controller.deactivateAccount
        );
        this.router.get(
            '/user-id/:userId',
            authenticate,
            this.controller.getUserById
        );
        this.router.post(
            '/admin/create',
            authenticate,
            authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]),
            validateBody(createUserSchema),
            this.controller.adminCreateUser
        );
    }

    public getRouter() {
        return this.router;
    }
}

export default new UserRoutes().getRouter();