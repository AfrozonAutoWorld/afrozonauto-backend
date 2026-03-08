"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../config/inversify.config");
const types_1 = require("../config/types");
const bodyValidate_1 = require("../middleware/bodyValidate");
const sourcing_request_validation_1 = require("../validation/schema/sourcing-request.validation");
const authMiddleware_1 = require("../middleware/authMiddleware");
const enums_1 = require("../generated/prisma/enums");
class SourcingRequestRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = inversify_config_1.container.get(types_1.TYPES.SourcingRequestController);
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Create (Find a Car submit) — public; optional auth to link userId
        this.router.post('/', authMiddleware_1.authenticateOptional, (0, bodyValidate_1.validateBody)(sourcing_request_validation_1.createSourcingRequestSchema), this.controller.create);
        // Admin: list all sourcing requests
        this.router.get('/', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([enums_1.UserRole.OPERATIONS_ADMIN, enums_1.UserRole.SUPER_ADMIN]), this.controller.listForAdmin);
        // Admin: get one by id
        this.router.get('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([enums_1.UserRole.OPERATIONS_ADMIN, enums_1.UserRole.SUPER_ADMIN]), this.controller.getById);
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new SourcingRequestRoutes().getRouter();
