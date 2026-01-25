"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../config/inversify.config");
const types_1 = require("../config/types");
const bodyValidate_1 = require("../middleware/bodyValidate");
const cloudinaryUploads_1 = require("../middleware/cloudinaryUploads");
const multer_config_1 = require("../config/multer.config");
const authMiddleware_1 = require("../middleware/authMiddleware");
const enums_1 = require("../generated/prisma/enums");
const testimonial_vallidation_1 = require("../validation/schema/testimonial.vallidation");
class TestimonialRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = inversify_config_1.container.get(types_1.TYPES.TestimonialController);
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post('/', authMiddleware_1.authenticate, multer_config_1.upload.array('files', 5), cloudinaryUploads_1.uploadToCloudinary, (0, bodyValidate_1.validateBody)(testimonial_vallidation_1.createTestimonialSchema), this.controller.create);
        this.router.get('/:id', authMiddleware_1.authenticate, this.controller.getAllTestimonials);
        this.router.patch('/', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([enums_1.UserRole.OPERATIONS_ADMIN, enums_1.UserRole.SUPER_ADMIN]), this.controller.approve);
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new TestimonialRoutes().getRouter();
