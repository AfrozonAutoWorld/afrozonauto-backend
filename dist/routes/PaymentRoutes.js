"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../config/inversify.config");
const types_1 = require("../config/types");
const authMiddleware_1 = require("../middleware/authMiddleware");
const bodyValidate_1 = require("../middleware/bodyValidate");
const multer_config_1 = require("../config/multer.config");
const cloudinaryUploads_1 = require("../middleware/cloudinaryUploads");
const payment_validation_1 = require("../validation/schema/payment.validation");
class PaymentRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = inversify_config_1.container.get(types_1.TYPES.PaymentController);
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Initiate payment
        this.router.post('/init', authMiddleware_1.authenticate, (0, bodyValidate_1.validateBody)(payment_validation_1.initPaymentSchema), this.controller.initPayment);
        this.router.patch('/verify/:reference', authMiddleware_1.authenticate, this.controller.verifyPayment);
        this.router.post('/webhooks/paystack', this.controller.paystackWebhook);
        this.router.post('/webhooks/stripe', this.controller.stripeWebhook);
        // get payments
        this.router.get('/all', authMiddleware_1.authenticate, this.controller.getAllPayments);
        this.router.get('/user-mine', authMiddleware_1.authenticate, this.controller.getAllUserPayments);
        this.router.get('/payment-id/:id', authMiddleware_1.authenticate, this.controller.getPaymentById);
        // Buyer: one-shot bank transfer — creates order + payment + attaches evidence simultaneously
        this.router.post('/bank-transfer/initiate', authMiddleware_1.authenticate, multer_config_1.upload.array('evidence', 1), (0, bodyValidate_1.validateBody)(payment_validation_1.bankTransferInitiateSchema), cloudinaryUploads_1.uploadToCloudinary, this.controller.initiateBankTransfer);
        // Buyer: attach evidence to an existing order's payment record
        this.router.post('/orders/:orderId/evidence', authMiddleware_1.authenticate, multer_config_1.upload.array('evidence', 1), cloudinaryUploads_1.uploadToCloudinary, this.controller.uploadEvidence);
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new PaymentRoutes().getRouter();
