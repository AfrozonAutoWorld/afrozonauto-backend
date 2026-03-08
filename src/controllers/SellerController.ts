import { Response, Request } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { SellerService } from '../services/SellerService';
import { AuthenticatedRequest } from '../types/customRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { UserRole, SellerVerificationStatus } from '../generated/prisma/client';
import TokenService from '../services/TokenService';
import { UserService } from '../services/UserService';
import { AuthService } from '../services/AuthService';

@injectable()
export class SellerController {
    constructor(
        @inject(TYPES.SellerService) private service: SellerService,
        @inject(TYPES.TokenService) private tokenService: TokenService,
        @inject(TYPES.UserService) private userService: UserService,
        @inject(TYPES.AuthService) private authService: AuthService
    ) { }

    /**
     * Part 1: Check email and send verification token for new seller
     */
    checkSellerEmail = asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.body;
        if (!email) throw ApiError.badRequest('Email is required');

        const user = await this.userService.getUserByEmail(email);
        if (user) throw ApiError.badRequest('User already exists');

        await this.tokenService.sendVerificationToken(undefined, email);
        return res.json(ApiResponse.success({ email }, 'Verification token sent to email'));
    });

    /**
     * Part 2: Verify the token sent to the email
     */
    verifySellerEmail = asyncHandler(async (req: Request, res: Response) => {
        const { email, token } = req.body;
        if (!email || !token) throw ApiError.badRequest('Email and token are required');

        const tokenNumber = typeof token === 'string' ? parseInt(token, 10) : Number(token);
        await this.authService.verifyUser(email, tokenNumber);

        return res.json(ApiResponse.success(null, 'Email verified successfully'));
    });

    /**
     * Part 3: specialized registration for sellers (guest -> pending seller)
     * This requires the email to have been verified in Parts 1 & 2.
     */
    registerSeller = asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.body;

        // Validate that email has been verified via token
        const usedToken = await this.tokenService.getUsedTokenForUser({ email });
        if (!usedToken) {
            throw ApiError.badRequest('Please verify your email before registering');
        }

        const { user, profile } = await this.service.registerSeller(req.body);

        // Clean up the used token record
        await this.tokenService.deleteToken({ email });

        return res.status(201).json(ApiResponse.created({ user, profile }, 'Seller registered successfully. Account pending administrative verification.'));
    });

    /**
     * applying as seller (authenticated user -> pending seller)
     */
    applyAsSeller = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) throw ApiError.unauthorized('User not authenticated');

        const profile = await this.service.applyAsSeller(req.user.id, req.body);
        return res.json(ApiResponse.success(profile, 'Seller application submitted for review. Account pending verification.'));
    });

    /**
     * Admin: getApplications (admin)
     */
    getApplications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.role !== UserRole.OPERATIONS_ADMIN) {
            throw ApiError.forbidden('Admin access required');
        }

        const { status } = req.query;
        const applications = await this.service.getApplications(status as SellerVerificationStatus);
        return res.json(ApiResponse.success(applications, 'Applications retrieved successfully'));
    });

    /**
     * Admin: verifySeller (admin)
     */
    verifySeller = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.role !== UserRole.OPERATIONS_ADMIN) {
            throw ApiError.forbidden('Admin access required');
        }

        const { id } = req.params;
        const { approve, reason } = req.body;

        const profile = await this.service.verifySeller(id, approve, reason);
        const message = approve ? 'Seller verified successfully' : 'Seller application rejected';
        return res.json(ApiResponse.success(profile, message));
    });
}
