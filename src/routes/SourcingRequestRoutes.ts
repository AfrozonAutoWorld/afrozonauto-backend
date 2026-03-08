import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { validateBody } from '../middleware/bodyValidate';
import { createSourcingRequestSchema } from '../validation/schema/sourcing-request.validation';
import { SourcingRequestController } from '../controllers/SourcingRequestController';
import { authenticate, authenticateOptional, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../generated/prisma/enums';

class SourcingRequestRoutes {
  private router = Router();
  private controller = container.get<SourcingRequestController>(TYPES.SourcingRequestController);

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Create (Find a Car submit) — public; optional auth to link userId
    this.router.post(
      '/',
      authenticateOptional,
      validateBody(createSourcingRequestSchema),
      this.controller.create
    );

    // Admin: list all sourcing requests
    this.router.get(
      '/',
      authenticate,
      authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]),
      this.controller.listForAdmin
    );

    // Admin: get one by id
    this.router.get(
      '/:id',
      authenticate,
      authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]),
      this.controller.getById
    );
  }

  public getRouter() {
    return this.router;
  }
}

export default new SourcingRequestRoutes().getRouter();
