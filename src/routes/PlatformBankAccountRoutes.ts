import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { PlatformBankAccountController } from '../controllers/PlatformBankAccountController';
import { authenticate, requireAdmin } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/bodyValidate';
import {
  createPlatformBankAccountSchema,
  updatePlatformBankAccountSchema,
} from '../validation/schema/platform-bank-account.validation';

class PlatformBankAccountRoutes {
  private router: Router;
  private controller: PlatformBankAccountController;

  constructor() {
    this.router = Router();
    this.controller = container.get<PlatformBankAccountController>(
      TYPES.PlatformBankAccountController
    );
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // ── Public ──────────────────────────────────────────────────────────────
    // List all active bank accounts (shown to buyers for manual payment)
    this.router.get('/', this.controller.listActive);

    // Filter active accounts by currency
    this.router.get('/by-currency/:currency', this.controller.listByCurrency);

    // ── Admin ────────────────────────────────────────────────────────────────
    // Get all accounts including inactive
    this.router.get('/admin/all', authenticate, requireAdmin, this.controller.listAll);

    // Create a new platform bank account
    this.router.post(
      '/',
      authenticate,
      requireAdmin,
      validateBody(createPlatformBankAccountSchema),
      this.controller.create
    );

    // Update account details
    this.router.patch(
      '/:id',
      authenticate,
      requireAdmin,
      validateBody(updatePlatformBankAccountSchema),
      this.controller.update
    );

    // Set account as primary for its currency
    this.router.patch('/:id/set-primary', authenticate, requireAdmin, this.controller.setPrimary);

    // Toggle active/inactive
    this.router.patch('/:id/toggle', authenticate, requireAdmin, this.controller.toggleActive);

    // Delete account
    this.router.delete('/:id', authenticate, requireAdmin, this.controller.delete);
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new PlatformBankAccountRoutes().getRouter();
