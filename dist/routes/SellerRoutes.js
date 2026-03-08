"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../config/inversify.config");
const types_1 = require("../config/types");
const seller_validation_1 = require("../validation/schema/seller.validation");
const bodyValidate_1 = require("../middleware/bodyValidate");
const authMiddleware_1 = require("../middleware/authMiddleware");
class SellerRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = inversify_config_1.container.get(types_1.TYPES.SellerController);
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Guest flow: verify email then register
        this.router.post('/check-email', (0, bodyValidate_1.validateBody)(seller_validation_1.checkEmailSchema), this.controller.checkSellerEmail);
        this.router.post('/verify-token', (0, bodyValidate_1.validateBody)(seller_validation_1.verifyTokenSchema), this.controller.verifySellerEmail);
        this.router.post('/register', (0, bodyValidate_1.validateBody)(seller_validation_1.registerSellerSchema), this.controller.registerSeller);
        // Existing user flow: authenticated application
        this.router.post('/apply', authMiddleware_1.authenticate, (0, bodyValidate_1.validateBody)(seller_validation_1.applyAsSellerSchema), this.controller.applyAsSeller);
        // Admin endpoints
        this.router.get('/applications', authMiddleware_1.authenticate, this.controller.getApplications);
        this.router.patch('/applications/:id/verify', authMiddleware_1.authenticate, (0, bodyValidate_1.validateBody)(seller_validation_1.verifySellerSchema), this.controller.verifySeller);
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new SellerRoutes().getRouter();
