import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { VehicleRepository, SellerListingFilters } from '../repositories/VehicleRepository';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { Vehicle, VehicleStatus, Prisma, VehicleSource, UserRole } from '../generated/prisma/client';
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
    /** Maps seller body-style labels to marketplace `vehicleType` (filters / rails). */
    private static vehicleTypeFromBodyStyle(bodyStyle?: string): string {
        if (!bodyStyle?.trim()) return 'CAR';
        const b = bodyStyle.trim().toLowerCase();
        const map: Record<string, string> = {
            sedan: 'SEDAN',
            suv: 'SUV',
            hatchback: 'HATCHBACK',
            coupe: 'COUPE',
            convertible: 'CONVERTIBLE',
            wagon: 'WAGON',
            van: 'VAN',
            'pickup truck': 'TRUCK',
            truck: 'TRUCK',
        };
        return map[b] ?? 'CAR';
    }

    /** Parses "City, ST" from contact city field into dealerCity + dealerState for marketplace state filter. */
    private static parseDealerLocation(cityField?: string): { dealerCity?: string; dealerState?: string } {
        const raw = (cityField ?? '').trim();
        if (!raw) return {};
        const m = raw.match(/^(.+?),\s*([A-Za-z]{2})\s*$/);
        if (m) {
            return { dealerCity: m[1].trim(), dealerState: m[2].toUpperCase() };
        }
        return { dealerCity: raw };
    }

    /** Normalizes seller payloads: vehicle type, dealer location fields; strips non-persisted keys. */
    private static applySellerListingNormalization(data: Record<string, unknown>): void {
        delete data.existingImageUrls;
        const vt = data.vehicleType;
        if (!vt || vt === 'OTHER') {
            data.vehicleType = SellerVehicleService.vehicleTypeFromBodyStyle(data.bodyStyle as string | undefined);
        }
        const loc = SellerVehicleService.parseDealerLocation(data.city as string | undefined);
        if (loc.dealerCity) data.dealerCity = loc.dealerCity;
        if (loc.dealerState) data.dealerState = loc.dealerState;
        if (data.zipCode) data.dealerZipCode = data.zipCode;
    }

    async submitListing(data: any, userRole?: UserRole): Promise<Vehicle> {
        const isAdmin = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.OPERATIONS_ADMIN;

        if (!isAdmin && data.userId) {
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
            data.vin = SellerVehicleService.generateTempVin();
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
        /** Only verified sellers can reach this flow; publish as AVAILABLE on the marketplace. */
        data.status = VehicleStatus.AVAILABLE;

        SellerVehicleService.applySellerListingNormalization(data);

        try {
            return await this.vehicleRepo.createSellerListing(data);
        } catch (err: any) {
            // P2002 on VIN means our placeholder collided — retry once with fresh VIN
            if (err?.code === 'P2002' && err?.meta?.target?.includes('vin')) {
                data.vin = SellerVehicleService.generateTempVin();
                return this.vehicleRepo.createSellerListing(data);
            }
            throw err;
        }
    }

    private static generateTempVin(): string {
        const rand = () => Math.random().toString(36).substring(2, 8).toUpperCase();
        return `TEMP-${Date.now().toString(36).toUpperCase()}-${rand()}${rand()}`;
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
     * List seller-submitted vehicles for the authenticated user (dashboard).
     */
    async getMyListings(
        userId: string,
        pagination: { page?: number; limit?: number } = {}
    ): Promise<{ listings: Vehicle[]; total: number }> {
        return this.vehicleRepo.findSellerListings({ userId }, pagination);
    }

    /**
     * Move a rejected seller listing back to pending review (seller resubmits).
     */
    async markAsSold(id: string, userId: string): Promise<Vehicle> {
        const listing = await this.vehicleRepo.findSellerById(id);
        if (!listing) throw ApiError.notFound('Listing not found');
        if (listing.userId !== userId) throw ApiError.forbidden('Access denied');
        if (listing.source !== VehicleSource.SELLER) {
            throw ApiError.badRequest('Only seller listings can be updated');
        }
        if (listing.status !== VehicleStatus.AVAILABLE) {
            throw ApiError.badRequest('Only approved (live) listings can be marked as sold');
        }
        return this.vehicleRepo.update(id, { status: VehicleStatus.SOLD });
    }

    /**
     * Seller updates their listing (same field set as submit).
     * - Rejected → pending review (clears rejection/admin review fields).
     * - Approved (live) or in admin review → pending review so the team can verify edits before the listing is live again.
     */
    async updateMyListing(id: string, userId: string, data: Record<string, unknown>): Promise<Vehicle> {
        const listing = await this.vehicleRepo.findSellerById(id);
        if (!listing) throw ApiError.notFound('Listing not found');
        if (listing.userId !== userId) throw ApiError.forbidden('Access denied');
        if (listing.source !== VehicleSource.SELLER) {
            throw ApiError.badRequest('Only seller listings can be updated');
        }
        const editable: VehicleStatus[] = [
            VehicleStatus.PENDING_REVIEW,
            VehicleStatus.REJECTED,
            VehicleStatus.AVAILABLE,
            VehicleStatus.REVIEWING,
        ];
        if (!editable.includes(listing.status)) {
            throw ApiError.badRequest('This listing cannot be edited in its current state');
        }

        const { images, videos, askingPrice, ...rest } = data as any;
        if (rest.additionalNotes !== undefined) {
            rest.manualNotes = rest.additionalNotes;
            delete rest.additionalNotes;
        }
        delete rest.uploadedFiles;
        delete rest.userId;

        SellerVehicleService.applySellerListingNormalization(rest);

        const updatePayload: Prisma.VehicleUpdateInput = {
            ...rest,
            images: images as string[],
            videos: videos as string[],
            priceUsd: askingPrice as number,
        } as Prisma.VehicleUpdateInput;

        if (listing.status === VehicleStatus.REJECTED) {
            updatePayload.status = VehicleStatus.PENDING_REVIEW;
            updatePayload.adminNotes = null;
            updatePayload.reviewedAt = null;
            updatePayload.reviewedBy = null;
        } else if (
            listing.status === VehicleStatus.AVAILABLE ||
            listing.status === VehicleStatus.REVIEWING
        ) {
            updatePayload.status = VehicleStatus.PENDING_REVIEW;
            updatePayload.reviewedAt = null;
            updatePayload.reviewedBy = null;
        }

        return this.vehicleRepo.update(id, updatePayload);
    }

    async resubmitForReview(id: string, userId: string): Promise<Vehicle> {
        const listing = await this.vehicleRepo.findSellerById(id);
        if (!listing) throw ApiError.notFound('Listing not found');
        if (listing.userId !== userId) throw ApiError.forbidden('Access denied');
        if (listing.source !== VehicleSource.SELLER) {
            throw ApiError.badRequest('Only seller listings can be resubmitted');
        }
        if (listing.status !== VehicleStatus.REJECTED) {
            throw ApiError.badRequest('Only rejected listings can be resubmitted for review');
        }
        return this.vehicleRepo.update(id, {
            status: VehicleStatus.PENDING_REVIEW,
            reviewedAt: null,
            reviewedBy: null,
            adminNotes: null,
        });
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
