import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { VehicleRepository, SellerListingFilters } from '../repositories/VehicleRepository';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { Vehicle, VehicleStatus, Prisma, VehicleSource } from '../generated/prisma/client';
import { ApiError } from '../utils/ApiError';

@injectable()
export class SellerVehicleService {
    constructor(
        @inject(TYPES.VehicleRepository) private vehicleRepo: VehicleRepository,
        @inject(TYPES.ProfileRepository) private profileRepo: ProfileRepository
    ) { }

    /**
     * Submit a new vehicle listing
     */
    async submitListing(data: any): Promise<Vehicle> {
        if (data.userId) {
            const profile = await this.profileRepo.findUserById(data.userId);
            if (!profile || !profile.isSeller) {
                throw ApiError.forbidden('You must be a verified seller to list vehicles');
            }
        }

        // additionalNotes (UI field) → manualNotes (Vehicle model field)
        if (data.additionalNotes !== undefined) {
            data.manualNotes = data.additionalNotes;
            delete data.additionalNotes;
        }

        // Generate a unique VIN placeholder if the seller doesn't know theirs
        if (!data.vin) {
            data.vin = `SELLER-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        }

        // Auto-generate slug from make/model/year
        if (!data.slug) {
            const base = `${data.year}-${data.make}-${data.model}`
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            data.slug = `${base}-${Date.now()}`;
        }

        data.source = VehicleSource.SELLER;
        data.status = VehicleStatus.PENDING_REVIEW;

        return this.vehicleRepo.createSellerListing(data);
    }

    /**
     * Get a listing by ID
     */
    async getListingById(id: string): Promise<Vehicle> {
        const listing = await this.vehicleRepo.findSellerById(id);
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
        return this.vehicleRepo.findSellerListings(filters, pagination);
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
        const listing = await this.vehicleRepo.findSellerById(id);
        if (!listing) throw ApiError.notFound('Listing not found');

        return this.vehicleRepo.update(id, {
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
        const listing = await this.vehicleRepo.findSellerById(id);
        if (!listing) throw ApiError.notFound('Listing not found');
        return this.vehicleRepo.update(id, data);
    }

    /**
     * Delete a listing
     */
    async deleteListing(id: string): Promise<void> {
        const listing = await this.vehicleRepo.findSellerById(id);
        if (!listing) throw ApiError.notFound('Listing not found');
        await this.vehicleRepo.hardDelete(id);
    }
}
