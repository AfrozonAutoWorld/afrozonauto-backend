import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../generated/prisma/enums';

// Controllers
import { AdminDashboardController } from '../controllers/AdminDashboardController';
import { UserController } from '../controllers/UserController';
import { PaymentController } from '../controllers/PaymentController';
import { NotificationController } from '../controllers/NotificationController';
import { validateBody } from '../middleware/bodyValidate';
import { createUserSchema } from '../validation/schema/user.vallidation';

const adminOnly = [
  authenticate,
  authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]),
];

class AdminRoutes {
  private router = Router();
  private dashboardController      = container.get<AdminDashboardController>(TYPES.AdminDashboardController);
  private userController           = container.get<UserController>(TYPES.UserController);
  private paymentController        = container.get<PaymentController>(TYPES.PaymentController);
  private notificationController   = container.get<NotificationController>(TYPES.NotificationController);

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // ── Dashboard ──────────────────────────────────────────────────────────
    this.router.get('/dashboard/stats',           ...adminOnly, this.dashboardController.getDashboardStats);
    this.router.get('/dashboard/pending-orders',  ...adminOnly, this.dashboardController.getPendingOrders);
    this.router.get('/dashboard/recent-activity', ...adminOnly, this.dashboardController.getRecentActivity);

    // ── Users ──────────────────────────────────────────────────────────────
    this.router.get('/users',                   ...adminOnly, this.userController.getUsers);
    this.router.get('/users/:userId',           ...adminOnly, this.userController.getUserById);
    this.router.post('/users/create',           ...adminOnly, validateBody(createUserSchema), this.userController.adminCreateUser);
    this.router.delete('/users/:userId',        ...adminOnly, this.userController.deactivateAccount);

    // ── Payments ───────────────────────────────────────────────────────────
    this.router.get('/payments/stats',              ...adminOnly, this.paymentController.getPaymentStats);
    this.router.get('/payments',                    ...adminOnly, this.paymentController.getAdminPayments);
    this.router.get('/payments/:id',                ...adminOnly, this.paymentController.getPaymentById);
    this.router.patch('/payments/:id/confirm',      ...adminOnly, this.paymentController.confirmPayment);
    this.router.patch('/payments/:id/reject',       ...adminOnly, this.paymentController.rejectPayment);

    // ── Notifications ──────────────────────────────────────────────────────
    this.router.get('/notifications/stats',             ...adminOnly, this.notificationController.getStats);
    this.router.get('/notifications',                   ...adminOnly, this.notificationController.getNotifications);
    this.router.patch('/notifications/mark-all-read',   ...adminOnly, this.notificationController.markAllAsRead);
    this.router.patch('/notifications/:id/read',        ...adminOnly, this.notificationController.markAsRead);
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new AdminRoutes().getRouter();
