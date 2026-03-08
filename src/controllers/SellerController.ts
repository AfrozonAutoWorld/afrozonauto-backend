import { Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { SellerService } from '../services/SellerService';
import { AuthenticatedRequest } from '../types/customRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { UserRole, SellerVerificationStatus } from '../generated/prisma/client';

@injectable()
export class SellerController {
    constructor(
        @inject(TYPES.SellerService) private service: SellerService
    ) { }

    /**
     * specialized registration for sellers (guest -> pending seller)
     */
    registerSeller = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const { user, profile } = await this.service.registerSeller(req.body);
        return res.status(201).json(ApiResponse.created({ user, profile }, 'Seller registered. An email verification code has been sent. Account pending verification.'));
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
