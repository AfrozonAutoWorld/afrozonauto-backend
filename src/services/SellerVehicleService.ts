import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { SellerVehicleRepository, SellerListingFilters } from '../repositories/SellerVehicleRepository';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { Vehicle, VehicleStatus, Prisma, VehicleSource } from '../generated/prisma/client';
import { ApiError } from '../utils/ApiError';

@injectable()
export class SellerVehicleService {
    constructor(
        @inject(TYPES.SellerVehicleRepository) private sellerRepo: SellerVehicleRepository,
        @inject(TYPES.ProfileRepository) private profileRepo: ProfileRepository
    ) { }

    /**
     * Submit a new vehicle listing
     */
    async submitListing(data: any): Promise<Vehicle> {
        // If user is provided, check if they are a verified seller
        if (data.userId) {
            const profile = await this.profileRepo.findUserById(data.userId);
            if (!profile || !profile.isSeller) {
                throw ApiError.forbidden('You must be a verified seller to list vehicles');
            }
        }

        // Set initial status for seller listings
        data.source = VehicleSource.SELLER;
        data.status = VehicleStatus.PENDING_REVIEW;

        return this.sellerRepo.create(data);
    }

    /**
     * Get a listing by ID
     */
    async getListingById(id: string): Promise<Vehicle> {
        const listing = await this.sellerRepo.findById(id);
        if (!listing) throw ApiError.notFound('Listing not found');
        return listing;
    }

    /**
     * List all listings (Admin)
     */
    async getListings(
        filters: SellerListingFilters,
        pagination: { page?: number; limit?: number } = {}
    ): Promise<{ listings: Vehicle[]; total: number }> {
        return this.sellerRepo.findMany(filters, pagination);
    }

    /**
     * Update listing status (Admin)
     */
    async updateStatus(
        id: string,
        status: VehicleStatus,
        adminNotes?: string,
        reviewedBy?: string
    ): Promise<Vehicle> {
        const listing = await this.sellerRepo.findById(id);
        if (!listing) throw ApiError.notFound('Listing not found');

        return this.sellerRepo.update(id, {
            status,
            adminNotes,
            reviewedBy,
            reviewedAt: new Date(),
        });
    }

    /**
     * Update listing details (User/Admin)
     */
    async updateListing(id: string, data: Prisma.VehicleUpdateInput): Promise<Vehicle> {
        const listing = await this.sellerRepo.findById(id);
        if (!listing) throw ApiError.notFound('Listing not found');

        // Logic to prevent editing if already approved/rejected could go here
        if (listing.status === VehicleStatus.AVAILABLE || listing.status === VehicleStatus.REJECTED) {
            // If it's AVAILABLE, it means it's already approved. 
            // In a real app, we might allow edits but they might require re-approval or just update the live listing.
            // For now let's keep it simple.
        }

        return this.sellerRepo.update(id, data);
    }

    /**
     * Delete a listing
     */
    async deleteListing(id: string): Promise<void> {
        const listing = await this.sellerRepo.findById(id);
        if (!listing) throw ApiError.notFound('Listing not found');
        await this.sellerRepo.delete(id);
    }
}
