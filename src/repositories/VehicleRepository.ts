import { injectable } from 'inversify';
import prisma from '../db';
import { Vehicle, VehicleType, VehicleStatus, VehicleSource, Prisma } from '../generated/prisma/client';

export interface VehicleFilters {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  vehicleType?: VehicleType;
  status?: VehicleStatus;
  source?: VehicleSource;
  dealerState?: string;
  isActive?: boolean;
  isHidden?: boolean;
  featured?: boolean;
  search?: string; // Search in model or VIN (make should be filtered explicitly, not searched)
}

export interface VehiclePagination {
  page?: number;
  limit?: number;
}

@injectable()
export class VehicleRepository {
  /**
   * Create a new vehicle
   */
  async create(data: Prisma.VehicleCreateInput): Promise<Vehicle> {
    return prisma.vehicle.create({ data });
  }

  /**
   * Find vehicle by ID
   */
  async findById(id: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({
      where: { id },
      include: {
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Find vehicle by VIN
   */
  async findByVIN(vin: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({ where: { vin } });
  }

  /**
   * Find which VINs already exist in DB (batch, single query)
   */
  async findExistingVINs(vins: string[]): Promise<Set<string>> {
    if (vins.length === 0) return new Set();
    const rows = await prisma.vehicle.findMany({
      where: { vin: { in: vins } },
      select: { vin: true },
    });
    return new Set(rows.map((r) => r.vin));
  }

  /**
   * Find vehicle by slug
   */
  async findBySlug(slug: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({ where: { slug } });
  }

  /**
   * Find vehicles with filters and pagination
   */
  async findMany(
    filters: VehicleFilters,
    pagination: VehiclePagination = {}
  ): Promise<{ vehicles: Vehicle[]; total: number }> {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 50, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    const where: Prisma.VehicleWhereInput = {
      isActive: filters.isActive !== false,
      isHidden: filters.isHidden !== true,
    };

    if (filters.make) where.make = { equals: filters.make, mode: 'insensitive' };
    if (filters.model) where.model = { equals: filters.model, mode: 'insensitive' };
    if (filters.vehicleType) where.vehicleType = filters.vehicleType;
    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;
    if (filters.dealerState) where.dealerState = filters.dealerState;
    if (filters.featured !== undefined) where.featured = filters.featured;

    if (filters.yearMin || filters.yearMax) {
      where.year = {};
      if (filters.yearMin) where.year.gte = filters.yearMin;
      if (filters.yearMax) where.year.lte = filters.yearMax;
    }

    if (filters.priceMin || filters.priceMax) {
      where.priceUsd = {};
      if (filters.priceMin) where.priceUsd.gte = filters.priceMin;
      if (filters.priceMax) where.priceUsd.lte = filters.priceMax;
    }

    if (filters.mileageMax) {
      where.mileage = { lte: filters.mileageMax };
    }

    // Search filter: only search model and VIN (not make)
    // Make should be filtered explicitly, not searched
    if (filters.search) {
      const searchConditions: Prisma.VehicleWhereInput[] = [];
      const searchTerm = filters.search.trim();
      const isFullVIN = searchTerm.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/i.test(searchTerm);
      
      // Search model (if not already filtered)
      if (!filters.model) {
        searchConditions.push({ model: { contains: searchTerm, mode: 'insensitive' } });
      }
      
      // VIN search: full VIN (exact match) or partial VIN (if make/model are filtered for context)
      if (isFullVIN) {
        // Full VIN - exact match
        searchConditions.push({ vin: { equals: searchTerm.toUpperCase() } });
      } else if (filters.make || filters.model) {
        // Partial VIN search only when make/model are filtered (more specific context)
        searchConditions.push({ vin: { contains: searchTerm, mode: 'insensitive' } });
      }
      
      if (searchConditions.length > 0) {
        where.OR = searchConditions;
      }
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.vehicle.count({ where }),
    ]);

    return { vehicles, total };
  }

  /**
   * Update vehicle
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
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await prisma.vehicle.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  /**
   * Increment save count
   */
  async incrementSaveCount(id: string): Promise<void> {
    await prisma.vehicle.update({
      where: { id },
      data: { saveCount: { increment: 1 } },
    });
  }

  /**
   * Increment request count
   */
  async incrementRequestCount(id: string): Promise<void> {
    await prisma.vehicle.update({
      where: { id },
      data: { requestCount: { increment: 1 } },
    });
  }

  /**
   * Delete vehicle (soft delete by setting isActive = false)
   */
  async delete(id: string): Promise<Vehicle> {
    return prisma.vehicle.update({
      where: { id },
      data: { isActive: false, isHidden: true },
    });
  }
}

