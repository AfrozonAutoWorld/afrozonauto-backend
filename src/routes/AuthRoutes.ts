import { Router } from 'express';
import { container } from '../config/inversify.config';
import { TYPES } from '../config/types';
import { validateBody } from "../middleware/bodyValidate"
import { AuthController } from '../controllers/AuthController';
import { 
    createUserSchema,
    TokenValidationSchema,
    forgotSchema,
    loginSchema,
    userVerifySchema
} from '../validation/schema/user.vallidation';
import { authenticate } from '../middleware/authMiddleware';


class AuthRoutes {
    private router = Router();
    private controller = container.get<AuthController>(TYPES.AuthController);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            '/register-start',
            this.controller.checkUser.bind(this.controller) // Add .bind()
        );
        this.router.get(
            '/me',
            // authenticate,
            this.controller.cookieControls.bind(this.controller) // Add .bind()
        );
        
        this.router.post(
            '/register',
            validateBody(createUserSchema),
            this.controller.register.bind(this.controller) // Add .bind()
        );
   
        this.router.post(
            '/send-token-recovery-email',
            this.controller.sendRecoveryEmailToken.bind(this.controller) // Add .bind()
        ); 

        this.router.post(
            '/verify',
            validateBody(userVerifySchema),
            this.controller.verify.bind(this.controller) // Add .bind()
        );

        this.router.post(
            '/login',
            validateBody(loginSchema),
            this.controller.login.bind(this.controller) // Add .bind()
        ); 
        
        // forgot password flow
        this.router.post(
            '/forgot-password',
            this.controller.sendReset.bind(this.controller) // Add .bind()
        );
        
        this.router.post(
            '/token-validation-reset',
            validateBody(TokenValidationSchema),
            this.controller.tokenValidation.bind(this.controller) // Add .bind()
        );
        
        this.router.post(
            '/reset-password',
            validateBody(forgotSchema),
            this.controller.resetPassword.bind(this.controller) // Add .bind()
        );
     
        this.router.post(
            '/refresh-token',
            this.controller.refreshToken.bind(this.controller)
        );
  
        this.router.post(
            '/google-auth-verify',
            this.controller.verifyGoogleToken.bind(this.controller) // Add .bind()
        );

        this.router.post(
            '/apple-auth-initiate',
            this.controller.initiateAppleSignIn.bind(this.controller) // Add .bind()
        );
    }

    public getRouter() {
        return this.router;
    }
}

export default new AuthRoutes().getRouter();