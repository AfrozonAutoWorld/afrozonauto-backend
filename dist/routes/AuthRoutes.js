"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_config_1 = require("../config/inversify.config");
const types_1 = require("../config/types");
const bodyValidate_1 = require("../middleware/bodyValidate");
const user_vallidation_1 = require("../validation/schema/user.vallidation");
class AuthRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = inversify_config_1.container.get(types_1.TYPES.AuthController);
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post('/register-start', this.controller.checkUser.bind(this.controller) // Add .bind()
        );
        this.router.get('/me', 
        // authenticate,
        this.controller.cookieControls.bind(this.controller) // Add .bind()
        );
        this.router.post('/register', (0, bodyValidate_1.validateBody)(user_vallidation_1.createUserSchema), this.controller.register.bind(this.controller) // Add .bind()
        );
        this.router.post('/send-token-recovery-email', this.controller.sendRecoveryEmailToken.bind(this.controller) // Add .bind()
        );
        this.router.post('/verify', (0, bodyValidate_1.validateBody)(user_vallidation_1.userVerifySchema), this.controller.verify.bind(this.controller) // Add .bind()
        );
        this.router.post('/login', (0, bodyValidate_1.validateBody)(user_vallidation_1.loginSchema), this.controller.login.bind(this.controller) // Add .bind()
        );
        // forgot password flow
        this.router.post('/forgot-password', this.controller.sendReset.bind(this.controller) // Add .bind()
        );
        this.router.post('/token-validation-reset', (0, bodyValidate_1.validateBody)(user_vallidation_1.TokenValidationSchema), this.controller.tokenValidation.bind(this.controller) // Add .bind()
        );
        this.router.post('/reset-password', (0, bodyValidate_1.validateBody)(user_vallidation_1.forgotSchema), this.controller.resetPassword.bind(this.controller) // Add .bind()
        );
        this.router.post('/refresh-token', this.controller.refreshToken.bind(this.controller));
        this.router.post('/google-auth-verify', this.controller.verifyGoogleToken.bind(this.controller) // Add .bind()
        );
        this.router.post('/apple-auth-initiate', this.controller.initiateAppleSignIn.bind(this.controller) // Add .bind()
        );
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new AuthRoutes().getRouter();
