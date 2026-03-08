import { injectable } from 'inversify';
import prisma from '../db';
import { Vehicle, Prisma, VehicleStatus, VehicleSource } from '../generated/prisma/client';

export interface SellerListingFilters {
    status?: VehicleStatus;
    userId?: string;
    make?: string;
    model?: string;
    year?: number;
}

@injectable()
export class SellerVehicleRepository {
    /**
     * Create a new seller listing
     */
    async create(data: Prisma.VehicleCreateInput): Promise<Vehicle> {
        return prisma.vehicle.create({
            data: {
                ...data,
                source: VehicleSource.SELLER,
            }
        });
    }

    /**
     * Find listing by ID
     */
    async findById(id: string): Promise<Vehicle | null> {
        return prisma.vehicle.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        phone: true,
                    },
                },
            },
        });
    }

    /**
     * Find listings with filters and pagination
     */
    async findMany(
        filters: SellerListingFilters,
        pagination: { page?: number; limit?: number } = {}
    ): Promise<{ listings: Vehicle[]; total: number }> {
        const page = pagination.page || 1;
        const limit = Math.min(pagination.limit || 50, 100);
        const skip = (page - 1) * limit;

        const where: Prisma.VehicleWhereInput = {
            source: VehicleSource.SELLER
        };

        if (filters.status) where.status = filters.status;
        if (filters.userId) where.userId = filters.userId;
        if (filters.make) where.make = { equals: filters.make, mode: 'insensitive' };
        if (filters.model) where.model = { equals: filters.model, mode: 'insensitive' };
        if (filters.year) where.year = filters.year;

        const [listings, total] = await Promise.all([
            prisma.vehicle.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                        },
                    },
                },
            }),
            prisma.vehicle.count({ where }),
        ]);

        return { listings, total };
    }

    /**
     * Update listing
     */
    async update(
        id: string,
        data: Prisma.VehicleUpdateInput
    ): Promise<Vehicle> {
        return prisma.vehicle.update({
            where: { id },
            data,
        });
    }

    /**
     * Delete listing
     */
    async delete(id: string): Promise<Vehicle> {
        return prisma.vehicle.delete({
            where: { id },
        });
    }
}
