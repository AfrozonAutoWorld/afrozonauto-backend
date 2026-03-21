import { injectable } from 'inversify';
import prisma from '../db';
import { Vehicle, Prisma, VehicleSource } from '../generated/prisma/client';
import { VehicleFilters } from '../validation/interfaces/IVehicle';

export interface VehiclePagination {
  page?: number;
  limit?: number;
}

export interface SellerListingFilters {
  status?: string;
  userId?: string;
  make?: string;
  model?: string;
  year?: number;
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
   * Find vehicles by IDs (preserves order of ids when possible)
   */
  async findManyByIds(ids: string[]): Promise<Vehicle[]> {
    if (ids.length === 0) return [];
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: ids }, isActive: true, isHidden: false },
    });
    const byId = new Map(vehicles.map((v) => [v.id, v]));
    return ids.map((id) => byId.get(id)).filter((v): v is Vehicle => v != null);
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
      priceUsd: { gt: 0 },
    };

    if (filters.luxuryMakes?.length) {
      where.make = { in: filters.luxuryMakes };
    } else if (filters.make) {
      where.make = { equals: filters.make, mode: 'insensitive' };
    }
    if (filters.model) where.model = { equals: filters.model, mode: 'insensitive' };
    if (filters.vehicleType) where.vehicleType = filters.vehicleType;
    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;
    if (filters.dealerState) where.dealerState = filters.dealerState;
    if (filters.featured !== undefined) where.featured = filters.featured;
    if (filters.recommended !== undefined) (where as any).recommended = filters.recommended;
    if (filters.specialty !== undefined) (where as any).specialty = filters.specialty;

    if (filters.yearMin || filters.yearMax) {
      where.year = {};
      if (filters.yearMin) where.year.gte = filters.yearMin;
      if (filters.yearMax) where.year.lte = filters.yearMax;
    }

    if (filters.priceMin != null || filters.priceMax != null) {
      where.priceUsd = {
        gt: 0,
        ...(filters.priceMin != null && { gte: filters.priceMin }),
        ...(filters.priceMax != null && { lte: filters.priceMax }),
      };
    }

    if (filters.mileageMax) {
      where.mileage = { lte: filters.mileageMax };
    }

    if (filters.transmission) {
      where.transmission = { equals: filters.transmission, mode: 'insensitive' };
    }
    if (filters.exteriorColor) {
      where.exteriorColor = { equals: filters.exteriorColor, mode: 'insensitive' };
    }
    if (filters.interiorColor) {
      where.interiorColor = { equals: filters.interiorColor, mode: 'insensitive' };
    }
    if (filters.drivetrain) {
      where.drivetrain = { equals: filters.drivetrain, mode: 'insensitive' };
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
   * Find admin-curated recommended vehicles (for "Recommended for you" section).
   * Ordered by recommendedSortOrder asc, then createdAt desc.
   */
  async findRecommended(limit: number = 12): Promise<Vehicle[]> {
    return prisma.vehicle.findMany({
      where: {
        recommended: true,
        isActive: true,
        isHidden: false,
        priceUsd: { gt: 0 },
      },
      orderBy: [{ recommendedSortOrder: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  /**
   * Find admin-curated specialty vehicles (for "Specialty Vehicles" section).
   */
  async findSpecialty(limit: number = 12): Promise<Vehicle[]> {
    return prisma.vehicle.findMany({
      where: {
        specialty: true,
        isActive: true,
        isHidden: false,
        priceUsd: { gt: 0 },
      } as any,
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
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

  // ─── Seller listing methods ───────────────────────────────────────────────

  /**
   * Create a seller-submitted vehicle listing (forces source = SELLER)
   */
  async createSellerListing(data: Prisma.VehicleCreateInput): Promise<Vehicle> {
    return prisma.vehicle.create({
      data: { ...data, source: VehicleSource.SELLER },
    });
  }

  /**
   * Find a seller listing by ID, including the submitting user
   */
  async findSellerById(id: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, phone: true },
        },
      },
    });
  }

  /**
   * List seller-submitted vehicles with optional filters and pagination
   */
  async findSellerListings(
    filters: SellerListingFilters,
    pagination: VehiclePagination = {}
  ): Promise<{ listings: Vehicle[]; total: number }> {
    const page  = pagination.page  || 1;
    const limit = Math.min(pagination.limit || 50, 100);
    const skip  = (page - 1) * limit;

    const where: Prisma.VehicleWhereInput = { source: VehicleSource.SELLER };
    if (filters.status) where.status = filters.status as any;
    if (filters.userId) where.userId = filters.userId;
    if (filters.make)   where.make   = { equals: filters.make,  mode: 'insensitive' };
    if (filters.model)  where.model  = { equals: filters.model, mode: 'insensitive' };
    if (filters.year)   where.year   = filters.year;

    const [listings, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return { listings, total };
  }

  /**
   * Hard-delete a seller listing record
   */
  async hardDelete(id: string): Promise<Vehicle> {
    return prisma.vehicle.delete({ where: { id } });
  }
}

