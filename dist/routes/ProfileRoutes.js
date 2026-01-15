"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../config/inversify.config");
const types_1 = require("../config/types");
const cloudinaryUploads_1 = require("../middleware/cloudinaryUploads");
const multer_config_1 = require("../config/multer.config");
const authMiddleware_1 = require("../middleware/authMiddleware");
class ProfileRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = inversify_config_1.container.get(types_1.TYPES.ProfileController);
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Create profile (authenticated)
        this.router.post('/', authMiddleware_1.authenticate, this.controller.create);
        this.router.get('/:id', authMiddleware_1.authenticate, this.controller.getById);
        // Update current user's profile
        this.router.patch('/', authMiddleware_1.authenticate, multer_config_1.upload.array('files', 5), cloudinaryUploads_1.uploadToCloudinary, this.controller.update);
        // Delete profile by ID (admin or owner – enforce in middleware/service)
        this.router.delete('/:id', authMiddleware_1.authenticate, this.controller.delete);
        // List all profiles (admin-only – enforce role in middleware)
        this.router.get('/', authMiddleware_1.authenticate, this.controller.list);
        // Get current authenticated user's profile
        this.router.get('/me', authMiddleware_1.authenticate, this.controller.currentUserProfile);
        // Reset password for current user
        this.router.post('/reset-password', authMiddleware_1.authenticate, this.controller.resetPassword);
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new ProfileRoutes().getRouter();
