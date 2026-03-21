import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { PaymentController } from '../controllers/PaymentController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/bodyValidate';
import Joi from 'joi';
import { PaymentType, ShippingMethod, UserRole } from '../generated/prisma/enums';
import { upload } from '../config/multer.config';
import { uploadToCloudinary } from '../middleware/cloudinaryUploads';
import { bankTransferInitiateSchema, initPaymentSchema } from '../validation/schema/payment.validation';

class PaymentRoutes {
  private router: Router;
  private controller: PaymentController;

  constructor() {
    this.router = Router();
    this.controller = container.get<PaymentController>(TYPES.PaymentController);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Initiate payment
    this.router.post('/init', authenticate, validateBody(initPaymentSchema), this.controller.initPayment);
    this.router.patch('/verify/:reference', authenticate,  this.controller.verifyPayment);
    
    this.router.post('/webhooks/paystack', this.controller.paystackWebhook);
    this.router.post('/webhooks/stripe', this.controller.stripeWebhook);
    
    // get payments
    this.router.get('/all', authenticate, this.controller.getAllPayments);
    this.router.get('/user-mine', authenticate, this.controller.getAllUserPayments);
    this.router.get('/payment-id/:id', authenticate, this.controller.getPaymentById);

    // Buyer: one-shot bank transfer — creates order + payment + attaches evidence simultaneously
    this.router.post('/bank-transfer/initiate', authenticate, upload.array('evidence', 1), validateBody(bankTransferInitiateSchema), uploadToCloudinary, this.controller.initiateBankTransfer);

    // Buyer: attach evidence to an existing order's payment record
    this.router.post('/orders/:orderId/evidence', authenticate, upload.array('evidence', 1), uploadToCloudinary, this.controller.uploadEvidence);

    // Admin endpoints
    this.router.get('/admin/list', authenticate, authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]), this.controller.getAdminPayments);
    this.router.get('/admin/stats', authenticate, authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]), this.controller.getPaymentStats);
    this.router.patch('/:id/confirm', authenticate, authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]), this.controller.confirmPayment);
    this.router.patch('/:id/reject', authenticate, authorize([UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN]), this.controller.rejectPayment);
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new PaymentRoutes().getRouter();