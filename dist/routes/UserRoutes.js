"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../config/inversify.config");
const types_1 = require("../config/types");
const authMiddleware_1 = require("../middleware/authMiddleware");
const enums_1 = require("../generated/prisma/enums");
class UserRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = inversify_config_1.container.get(types_1.TYPES.UserController);
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/user-email/:email', authMiddleware_1.authenticate, this.controller.getUserByEmail);
        this.router.get('/', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([enums_1.UserRole.OPERATIONS_ADMIN, enums_1.UserRole.SUPER_ADMIN]), this.controller.getUsers);
        this.router.get('/user-id/:userId', authMiddleware_1.authenticate, this.controller.getUserById);
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new UserRoutes().getRouter();
