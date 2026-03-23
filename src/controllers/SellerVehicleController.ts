import { Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { SellerVehicleService } from '../services/SellerVehicleService';
import { AuthenticatedRequest } from '../types/customRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { UserRole, VehicleStatus } from '../generated/prisma/client';
import { allowEnum } from '../utils/enumUtils';

@injectable()
export class SellerVehicleController {
    constructor(
        @inject(TYPES.SellerVehicleService) private service: SellerVehicleService
    ) { }

    /**
     * Submit a new vehicle listing (Public/Authenticated)
     */
    submitListing = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        // Destructure to keep only Vehicle model fields (askingPrice is the UI alias for priceUsd)
        const { uploadedFiles, askingPrice, ...vehicleData } = req.body;

        const imageUrls = (uploadedFiles ?? [])
            .filter((f: any) => f.fileType === 'image')
            .map((f: any) => f.url);

        const videoUrls = (uploadedFiles ?? [])
            .filter((f: any) => f.fileType === 'video')
            .map((f: any) => f.url);

        const listing = await this.service.submitListing({
            ...vehicleData,
            priceUsd: askingPrice,
            images: imageUrls,
            videos: videoUrls,
            userId: req.user?.id ?? null,
        }, req.user?.role as UserRole | undefined);

        return res.status(201).json(ApiResponse.created(listing, 'Vehicle listing submitted for review'));
    });

    /**
     * Get listing by ID
     */
    getListing = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const { id } = req.params;
        const listing = await this.service.getListingById(id);

        // If not admin, check if it's the user's own listing
        if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.role !== UserRole.OPERATIONS_ADMIN) {
            if (listing.userId !== req.user?.id) {
                throw ApiError.forbidden('Access denied');
            }
        }

        return res.json(ApiResponse.success(listing, 'Listing retrieved successfully'));
    });

    /**
     * List listings with filters (Admin only)
     */
    getListings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.role !== UserRole.OPERATIONS_ADMIN) {
            throw ApiError.forbidden('Admin access required');
        }

        const filters = {
            status: allowEnum(req.query.status as string | undefined, VehicleStatus, 'status'),
            userId: req.query.userId as string,
            make: req.query.make as string,
            model: req.query.model as string,
            year: req.query.year ? parseInt(req.query.year as string, 10) : undefined,
        };

        const pagination = {
            page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        };

        const result = await this.service.getListings(filters, pagination);
        return res.json(ApiResponse.paginated(result.listings, {
            page: pagination.page,
            limit: pagination.limit,
            total: result.total,
            pages: Math.ceil(result.total / pagination.limit),
        }, 'Listings retrieved successfully'));
    });

    /**
     * Update listing status (Admin only)
     */
    updateStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.role !== UserRole.OPERATIONS_ADMIN) {
            throw ApiError.forbidden('Admin access required');
        }

        const { id } = req.params;
        const { status, adminNotes } = req.body;

        const listing = await this.service.updateStatus(id, status, adminNotes, req.user.id);
        return res.json(ApiResponse.success(listing, `Listing ${status.toLowerCase()} successfully`));
    });

    /**
     * Delete listing (Owner or Admin)
     */
    deleteListing = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const { id } = req.params;
        const listing = await this.service.getListingById(id);

        if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.role !== UserRole.OPERATIONS_ADMIN) {
            if (listing.userId !== req.user?.id) {
                throw ApiError.forbidden('Access denied');
            }
        }

        await this.service.deleteListing(id);
        return res.json(ApiResponse.success(null, 'Listing deleted successfully'));
    });
}
