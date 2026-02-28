import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { VehicleRepository, VehiclePagination } from '../repositories/VehicleRepository';
import { SavedVehicleRepository } from '../repositories/SavedVehicleRepository';
import { VehicleFilters } from '../validation/interfaces/IVehicle';
import { AutoDevService,  } from './AutoDevService';
import { TrendingService } from './TrendingService';
import { RecommendedService } from './RecommendedService';
import { CategoryService } from './CategoryService';
import { VehicleTransformer } from '../helpers/vehicle-transformer';
import { VehicleLogs } from '../helpers/vehicleLogs';
import { Vehicle, VehicleSource, VehicleType, Prisma } from '../generated/prisma/client';
import { CreateVehicleDto } from '../validation/dtos/vehicle.dto';
import { ApiError } from '../utils/ApiError';
import loggers from '../utils/loggers';
import { AutoDevListingsParams } from '../validation/interfaces/IAutoDev';

@injectable()
export class VehicleServiceDirect {
  private readonly cacheTTLHours: number;

  constructor(
    @inject(TYPES.VehicleRepository) private vehicleRepo: VehicleRepository,
    @inject(TYPES.SavedVehicleRepository) private savedVehicleRepo: SavedVehicleRepository,
    @inject(TYPES.AutoDevService) private autoDevService: AutoDevService,
    @inject(TYPES.TrendingService) private trendingService: TrendingService,
    @inject(TYPES.RecommendedService) private recommendedService: RecommendedService,
    @inject(TYPES.CategoryService) private categoryService: CategoryService
  ) {
    this.cacheTTLHours = parseInt(process.env.REDIS_CACHE_TTL_HOURS || '12', 10);
  }

  async getTrendingVehicles(): Promise<Vehicle[]> {
    return this.trendingService.getTrendingVehicles();
  }

  private static readonly DEFAULT_RECOMMENDATION_REASON =
    'Near-new, under 15k miles, exceptional condition at this price';

  /**
   * Get vehicles for "Recommended for you":
   * (1) If userId: prepend vehicles the user saved ("You saved this").
   * (2) Primary: fetch from Auto.dev per RecommendedDefinition (like Trending), with reason per definition.
   * (3) Secondary: DB vehicles with recommended=true (recommendationReason or default).
   * Dedupe by id/VIN, slice to limit.
   */
  async getRecommendedVehicles(
    limit: number = 12,
    userId?: string
  ): Promise<Array<{ vehicle: Vehicle; reason: string }>> {
    const seen = new Set<string>();
    const result: Array<{ vehicle: Vehicle; reason: string }> = [];

    const keyOf = (v: Vehicle): string => v.id || (v.vin ? `vin-${v.vin}` : '');

    // (1) Logged-in: prepend saved vehicles
    if (userId) {
      const savedIds = await this.savedVehicleRepo.findVehicleIdsByUserId(userId, 6);
      if (savedIds.length > 0) {
        const savedVehicles = await this.vehicleRepo.findManyByIds(savedIds);
        for (const v of savedVehicles) {
          const k = keyOf(v);
          if (k && !seen.has(k)) {
            seen.add(k);
            result.push({ vehicle: v, reason: 'You saved this' });
          }
        }
      }
    }

    // (2) Primary: from Auto.dev per RecommendedDefinition
    const fromDefinitions = await this.recommendedService.getFromDefinitions(limit);
    for (const { vehicle, reason } of fromDefinitions) {
      const k = keyOf(vehicle);
      if (k && !seen.has(k)) {
        seen.add(k);
        result.push({ vehicle, reason });
      }
      if (result.length >= limit) return result.slice(0, limit);
    }

    // (3) Secondary: DB-flagged recommended
    const dbRecommended = await this.vehicleRepo.findRecommended(limit);
    const getDbReason = (v: Vehicle): string =>
      ((v as any).recommendationReason?.trim()) || VehicleServiceDirect.DEFAULT_RECOMMENDATION_REASON;
    for (const v of dbRecommended) {
      const k = keyOf(v);
      if (k && !seen.has(k)) {
        seen.add(k);
        result.push({ vehicle: v, reason: getDbReason(v) });
      }
      if (result.length >= limit) return result.slice(0, limit);
    }

    return result.slice(0, limit);
  }

  async getMakeModelsReference(): Promise<Record<string, string[]>> {
    return await this.autoDevService.fetchMakeModelsReference();
  }

  /**
   * Use to inspect what Auto.dev returns on e.g. page 4 and avoid Hummer/truck dominance.
   */
  async getAutoDevPageSummary(
    page: number = 4,
    limit: number = 24
  ): Promise<{
    page: number;
    limit: number;
    count: number;
    byMake: Record<string, number>;
    byMakeModel: Record<string, Record<string, number>>;
    sample: Array<{ make: string; model: string; year?: number }>;
  }> {
    const params: AutoDevListingsParams = { page, limit };
    const apiListings = await this.autoDevService.fetchListingsWithParams(params);

    const byMake: Record<string, number> = {};
    const byMakeModel: Record<string, Record<string, number>> = {};
    const sample: Array<{ make: string; model: string; year?: number }> = [];

    for (const listing of apiListings) {
      const v = (listing as any).vehicle || listing;
      const make = (v.make || '').toString().trim() || 'Unknown';
      const model = (v.model || '').toString().trim() || 'Unknown';
      const year = typeof v.year === 'number' ? v.year : undefined;

      byMake[make] = (byMake[make] ?? 0) + 1;
      if (!byMakeModel[make]) byMakeModel[make] = {};
      byMakeModel[make][model] = (byMakeModel[make][model] ?? 0) + 1;

      if (sample.length < 15) sample.push({ make, model, year });
    }

    return { page, limit, count: apiListings.length, byMake, byMakeModel, sample };
  }

  private filtersToAutoDevParams(
    filters: VehicleFilters,
    page?: number,
    limit?: number
  ): AutoDevListingsParams {
    const params: AutoDevListingsParams = {};
    if (page != null && page >= 1) params.page = page;
    if (limit != null && limit >= 1) params.limit = Math.min(limit, 100);
    if (filters.make) params['vehicle.make'] = filters.make;
    if (filters.model) params['vehicle.model'] = filters.model;
    if (filters.yearMin != null && filters.yearMax != null && filters.yearMin === filters.yearMax) {
      params['vehicle.year'] = String(filters.yearMin);
    } else if (filters.yearMin != null || filters.yearMax != null) {
      const min = filters.yearMin ?? 0;
      const max = filters.yearMax ?? new Date().getFullYear() + 1;
      params['vehicle.year'] = `${min}-${max}`;
    }
    if (filters.priceMin != null || filters.priceMax != null) {
      const min = filters.priceMin ?? 0;
      const max = filters.priceMax ?? 99999999;
      params['retailListing.price'] = `${min}-${max}`;
    }
    if (filters.mileageMax != null) {
      params['retailListing.miles'] = `0-${filters.mileageMax}`;
    }
    if (filters.dealerState) {
      params['retailListing.state'] = filters.dealerState;
    }
    if (filters.vehicleType) {
      const bodyStyle = VehicleTransformer.vehicleTypeToBodyStyle(filters.vehicleType as VehicleType);
      if (bodyStyle) params['vehicle.bodyStyle'] = bodyStyle;
    }
    if (filters.bodyStyle) params['vehicle.bodyStyle'] = filters.bodyStyle;
    if (filters.fuel) params['vehicle.fuel'] = filters.fuel;
    if (filters.transmission) params['vehicle.transmission'] = filters.transmission;
    if (filters.exteriorColor) params['vehicle.exteriorColor'] = filters.exteriorColor;
    if (filters.interiorColor) params['vehicle.interiorColor'] = filters.interiorColor;
    if (filters.zip) params.zip = filters.zip;
    if (filters.distance != null && filters.distance > 0) params.distance = filters.distance;
    if (filters.condition === 'used') {
      params['retailListing.used'] = 'true';
    } else if (filters.condition === 'cpo') {
      params['retailListing.cpo'] = 'true';
    } else if (filters.condition === 'new') {
      params['retailListing.used'] = 'false';
    }
    if (filters.drivetrain) params['vehicle.drivetrain'] = filters.drivetrain;
    if (filters.luxuryMakes?.length) params['vehicle.make'] = filters.luxuryMakes.join(',');
    return params;
  }

  private isPriceStale(vehicle: Vehicle): boolean {
    if (!vehicle.lastApiSync || vehicle.source !== VehicleSource.API) return false;
    const now = new Date();
    const lastSync = new Date(vehicle.lastApiSync);
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    return hoursSinceSync >= this.cacheTTLHours;
  }

  private async refreshVehiclePrice(vehicle: Vehicle): Promise<Vehicle | null> {
    if (!vehicle.vin || !this.isPriceStale(vehicle)) return null;

    const oldPrice = vehicle.priceUsd;
    const lastSync = vehicle.lastApiSync ? new Date(vehicle.lastApiSync).toISOString() : 'never';
    const hoursStale = vehicle.lastApiSync
      ? ((new Date().getTime() - new Date(vehicle.lastApiSync).getTime()) / (1000 * 60 * 60)).toFixed(1)
      : 'unknown';

    try {
      const listing = await this.autoDevService.fetchListingByVIN(vehicle.vin);
      const retailListing = listing?.retailListing ?? (listing as any);
      const newPrice = retailListing?.price ?? (listing as any)?.price ?? 0;

      if (!listing || !newPrice) return null;

      const priceDiff = newPrice - oldPrice;
      const priceDiffPercent = ((priceDiff / oldPrice) * 100).toFixed(2);
      const priceChangeDirection = priceDiff > 0 ? 'INCREASE' : priceDiff < 0 ? 'DECREASE' : 'NO_CHANGE';

      if (Math.abs(priceDiff) > 0.01) {
        const priceHistory = Array.isArray(vehicle.priceHistory) ? [...vehicle.priceHistory] : [];
        priceHistory.push({
          date: new Date().toISOString(),
          price: newPrice,
          previousPrice: oldPrice,
          priceChange: priceDiff,
          priceChangePercent: parseFloat(priceDiffPercent),
          reason: 'API_PRICE_UPDATE',
          source: 'autodev',
          dataSource: 'api',
        });
        const updateData: Prisma.VehicleUpdateInput = {
          priceUsd: newPrice,
          priceHistory: priceHistory as any,
          lastApiSync: new Date(),
          apiSyncStatus: 'SYNCED',
          apiSyncError: null,
          apiData: {
            ...(vehicle.apiData as any || {}),
            listing,
            raw: listing,
            syncedAt: new Date().toISOString(),
          } as any,
        };
        const updated = await this.vehicleRepo.update(vehicle.id, updateData);
        await VehicleLogs.logPriceUpdate(vehicle, {
          vin: vehicle.vin,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          oldPrice,
          newPrice,
          priceChange: priceDiff,
          priceChangePercent: parseFloat(priceDiffPercent),
          direction: priceChangeDirection,
          dataSource: 'api',
          lastSync: vehicle.lastApiSync?.toISOString(),
          hoursStale,
          priceHistoryCount: priceHistory.length,
        });
        return updated;
      }

      await this.vehicleRepo.update(vehicle.id, {
        lastApiSync: new Date(),
        apiSyncStatus: 'SYNCED',
      });
      await VehicleLogs.logPriceRefresh(vehicle, {
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        price: oldPrice,
        dataSource: 'api',
        lastSync: vehicle.lastApiSync?.toISOString(),
        hoursStale,
        status: 'unchanged',
      });
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.vehicleRepo.update(vehicle.id, {
        apiSyncStatus: 'OUTDATED',
        apiSyncError: errorMessage,
      }).catch(() => {});
      await VehicleLogs.logPriceRefreshFailed(vehicle, {
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        currentPrice: oldPrice,
        error: errorMessage,
        lastSync: vehicle.lastApiSync?.toISOString(),
        hoursStale,
        status: 'failed',
      });
      return null;
    }
  }

  private sortVehiclesInPlace(
    vehicles: Vehicle[],
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc',
    demoteHummers: boolean = false
  ): void {
    if (!sortBy || vehicles.length === 0) return;

    let key: keyof Vehicle;
    switch (sortBy) {
      case 'price':
      case 'priceUsd':
        key = 'priceUsd';
        break;
      case 'year':
        key = 'year';
        break;
      case 'mileage':
        key = 'mileage';
        break;
      case 'createdAt':
      default:
        key = 'createdAt';
        break;
    }

    const isHummer = (v: Vehicle): boolean => {
      const make = (v.make || '').toLowerCase();
      const model = (v.model || '').toLowerCase();
      return make.includes('hummer') || model.includes('hummer');
    };

    vehicles.sort((a, b) => {
      if (demoteHummers) {
        const aH = isHummer(a);
        const bH = isHummer(b);
        if (aH !== bH) {
          // Non‑Hummers first, Hummers after
          return aH ? 1 : -1;
        }
      }

      const aVal = key === 'createdAt'
        ? ((a.createdAt as unknown as Date) ?? new Date(0)).getTime()
        : ((a as any)[key] ?? 0);
      const bVal = key === 'createdAt'
        ? ((b.createdAt as unknown as Date) ?? new Date(0)).getTime()
        : ((b as any)[key] ?? 0);

      if (aVal === bVal) return 0;
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }

  async getVehicles(
    filters: VehicleFilters,
    pagination: VehiclePagination = {},
    includeApiResults: boolean = true,
    categorySlug?: string,
    sortBy?: 'price' | 'year' | 'mileage' | 'createdAt',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{
    vehicles: Vehicle[];
    total: number;
    page: number;
    limit: number;
    pages: number;
    fromApi?: number;
    filteredCount?: number;
    apiUsed?: boolean;
    hasMore?: boolean;
  }> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;

    let resolvedFilters = filters;
    if (categorySlug) {
      const category = await this.categoryService.getBySlug(categorySlug);
      if (category) {
        resolvedFilters = { ...filters };
        if (category.bodyStyle) {
          (resolvedFilters as any).bodyStyle = category.bodyStyle;
          resolvedFilters.vehicleType = VehicleTransformer.mapVehicleType(
            category.bodyStyle
          ) as VehicleType;
        }
        if (category.fuel) (resolvedFilters as any).fuel = category.fuel;
        if (category.luxuryMakes?.length) (resolvedFilters as any).luxuryMakes = category.luxuryMakes;
        if (category.priceMin != null) resolvedFilters.priceMin = category.priceMin;
      }
    }

    const dbResult = await this.vehicleRepo.findMany(resolvedFilters, pagination);
    const staleVehicles = dbResult.vehicles.filter((v) => this.isPriceStale(v));
    Promise.all(
      staleVehicles.map((v) => this.refreshVehiclePrice(v).catch(() => null))
    ).catch(() => {});

    let apiVehicles: Vehicle[] = [];
    let fromApiCount = 0; // how many API listings made it into the response (after de-dup and price filter)
    let apiRawCount = 0; // how many the API actually returned (before our filtering)
    let apiOnlyCount = 0;

    if (includeApiResults) {
      try {
        // Where to start on Auto.dev: no filters → page 5 (avoid Hummer-heavy 1–4); with filters → page 1.
        const isBrowsingAll =
          !resolvedFilters.make &&
          !resolvedFilters.model &&
          !resolvedFilters.search &&
          !resolvedFilters.vehicleType &&
          !categorySlug;
        const apiPageBase = isBrowsingAll ? 5 : 1;
        const apiPage = apiPageBase + (page - 1);
        const apiLimit = limit;

        const apiParams = this.filtersToAutoDevParams(resolvedFilters, apiPage, apiLimit);
        const apiListings = await this.autoDevService.fetchListingsWithParams(apiParams);
        apiRawCount = apiListings.length;

        let filteredListings = apiListings;
        if (filters.search?.trim()) {
          const searchTerm = filters.search.trim().toLowerCase();
          const isFullVIN =
            searchTerm.length === 17 && /^[a-hj-npr-z0-9]{17}$/i.test(searchTerm);
          filteredListings = apiListings.filter((listing: any) => {
            const vehicle = listing.vehicle || listing;
            const model = (vehicle.model || listing.model || '').toLowerCase();
            const vin = (listing.vin || vehicle.vin || '').toUpperCase();
            if (isFullVIN && vin === searchTerm.toUpperCase()) return true;
            if (!filters.model && model.includes(searchTerm)) return true;
            if (vin.includes(searchTerm.toUpperCase())) return true;
            return false;
          });
        }

        const vinsToCheck = filteredListings.map((l: any) => l.vin).filter(Boolean);
        const existingVins = await this.vehicleRepo.findExistingVINs(vinsToCheck);
        const apiOnlyList = filteredListings.filter(
          (l: any) => l.vin && !existingVins.has(l.vin)
        );
        apiOnlyCount = apiOnlyList.length;

        const needCount = limit - dbResult.vehicles.length;
        // Take first needCount valid (de-dup done above; here we skip no/zero price and stop when we have enough).
        for (const listing of apiOnlyList) {
          if (apiVehicles.length >= needCount) break;
          const vehicleData = VehicleTransformer.fromAutoDevListing(listing, []);
          if (!vehicleData.priceUsd || vehicleData.priceUsd <= 0) continue;
          vehicleData.apiData = {
            listing,
            raw: listing,
            isTemporary: true,
            cached: false,
          };
          vehicleData.apiSyncStatus = 'PENDING';
          vehicleData.id = `temp-${listing.vin}`;
          apiVehicles.push(vehicleData as Vehicle);
        }
        fromApiCount = apiVehicles.length;
      } catch (error) {
        loggers.warn(
          'Failed to fetch from Auto.dev API (direct), returning DB results only:',
          error
        );
      }
    }

    const allVehicles: Vehicle[] = [...dbResult.vehicles, ...apiVehicles];

    if (sortBy) {
      const demoteHummers = !resolvedFilters.make && !resolvedFilters.vehicleType;
      this.sortVehiclesInPlace(allVehicles, sortBy, sortOrder, demoteHummers);
    }

    // We don't know total from Auto.dev; only reliable signal is full page. No total/pages when API is used.
    const usedApi = !!includeApiResults;
    const total = usedApi ? 0 : dbResult.total + apiOnlyCount;
    const pages = usedApi ? 0 : Math.ceil((dbResult.total + apiOnlyCount) / limit) || 1;
    const hasMore = allVehicles.length >= limit;

    return {
      vehicles: allVehicles,
      total,
      page,
      limit,
      pages,
      fromApi: apiRawCount,
      filteredCount: fromApiCount,
      apiUsed: !!includeApiResults,
      hasMore,
    };
  }

  async getVehicle(identifier: string, type: 'id' | 'vin' = 'id'): Promise<Vehicle> {
    if (type === 'vin') return this.getVehicleByVIN(identifier);
    const trim = (identifier || '').trim();
    if (trim.startsWith('temp-')) return this.getVehicleByVIN(trim.replace(/^temp-/, ''));
    if (this.looksLikeVin(trim)) return this.getVehicleByVIN(trim);
    if (this.isMongoObjectId(trim)) {
      let vehicle = await this.vehicleRepo.findById(trim);
      if (vehicle && this.isPriceStale(vehicle)) {
        const refreshed = await this.refreshVehiclePrice(vehicle);
        if (refreshed) vehicle = refreshed;
      }
      if (vehicle) {
        this.vehicleRepo.incrementViewCount(vehicle.id).catch((err) =>
          loggers.error('Failed to increment view count:', err)
        );
        return vehicle;
      }
      throw ApiError.notFound('Vehicle not found');
    }
    throw ApiError.badRequest(
      'Invalid identifier. Use a 24-character vehicle id or a 17-character VIN. For VIN use ?type=vin'
    );
  }

  async getVehicleByVIN(vin: string): Promise<Vehicle> {
    if (!vin || vin.trim().length !== 17) {
      throw ApiError.badRequest('Invalid VIN. Must be 17 characters');
    }
    const normalizedVin = vin.trim().toUpperCase();

    const fromDb = await this.vehicleRepo.findByVIN(normalizedVin);
    if (fromDb) {
      let vehicle = fromDb;
      if (this.isPriceStale(vehicle)) {
        const refreshed = await this.refreshVehiclePrice(vehicle);
        if (refreshed) vehicle = refreshed;
      }
      this.vehicleRepo.incrementViewCount(vehicle.id).catch((err) =>
        loggers.error('Failed to increment view count:', err)
      );
      return vehicle;
    }

    try {
      const [listing, photos, specs] = await Promise.all([
        this.autoDevService.fetchListingByVIN(normalizedVin),
        this.autoDevService.fetchPhotos(normalizedVin),
        this.autoDevService.fetchSpecifications(normalizedVin),
      ]);
      if (listing) {
        const vehicleData = VehicleTransformer.fromAutoDevListing(listing, photos || [], specs);
        vehicleData.apiData = {
          listing,
          specs,
          photos: photos || [],
          raw: listing,
          isTemporary: true,
        };
        vehicleData.apiSyncStatus = 'PENDING';
        vehicleData.id = `temp-${normalizedVin}`;
        if (vehicleData.id && !(vehicleData.id as string).startsWith('temp-')) {
          this.vehicleRepo.incrementViewCount(vehicleData.id as string).catch(() => {});
        }
        return vehicleData as Vehicle;
      }
    } catch (error) {
      loggers.warn(`Failed to fetch vehicle ${normalizedVin} from Auto.dev (direct):`, error);
    }
    throw ApiError.notFound('Vehicle not found');
  }

  async getVehicleByVINFromDB(vin: string): Promise<Vehicle | null> {
    return this.vehicleRepo.findByVIN(vin);
  }

  async createVehicle(dto: CreateVehicleDto, addedBy?: string): Promise<Vehicle> {
    const existing = await this.vehicleRepo.findByVIN(dto.vin);
    if (existing) throw ApiError.conflict('Vehicle with this VIN already exists');
    return this.vehicleRepo.create({
      ...dto,
      source: dto.source || VehicleSource.MANUAL,
      addedBy,
      isActive: dto.isActive !== false,
      isHidden: dto.isHidden || false,
    });
  }

  async syncFromAutoDev(vin: string): Promise<Vehicle> {
    const existing = await this.vehicleRepo.findByVIN(vin);
    try {
      const [listing, photos, specs] = await Promise.all([
        this.autoDevService.fetchListingByVIN(vin),
        this.autoDevService.fetchPhotos(vin),
        this.autoDevService.fetchSpecifications(vin),
      ]);
      if (!listing) {
        if (existing) {
          await this.vehicleRepo.update(existing.id, {
            apiSyncStatus: 'FAILED',
            apiSyncError: 'Vehicle not found in Auto.dev',
          });
        }
        throw ApiError.notFound('Vehicle not found in Auto.dev');
      }
      const vehicleData = VehicleTransformer.fromAutoDevListing(listing, photos || [], specs);
      vehicleData.apiData = { listing, specs, photos: photos || [], raw: listing, syncedAt: new Date().toISOString() };
      vehicleData.lastApiSync = new Date();
      vehicleData.apiSyncStatus = 'SYNCED';
      vehicleData.apiSyncError = null;
      if (existing) {
        return this.vehicleRepo.update(existing.id, vehicleData as Prisma.VehicleUpdateInput);
      }
      return this.vehicleRepo.create(vehicleData as any);
    } catch (error: any) {
      if (existing) {
        await this.vehicleRepo.update(existing.id, {
          apiSyncStatus: 'FAILED',
          apiSyncError: error.message || 'Failed to sync from Auto.dev API',
        });
      }
      throw ApiError.badGateway('Failed to sync vehicle from Auto.dev API');
    }
  }

  private isValidId(id: string): boolean {
    return !!(id && id.trim() && !id.startsWith(':') && id !== 'null' && id !== 'undefined');
  }
  private isMongoObjectId(s: string): boolean {
    return /^[a-fA-F0-9]{24}$/.test((s || '').trim());
  }
  private looksLikeVin(s: string): boolean {
    const t = (s || '').trim();
    return t.length === 17 && /^[A-HJ-NPR-Z0-9]+$/i.test(t);
  }

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    if (!this.isValidId(id)) throw ApiError.badRequest('Invalid vehicle ID provided');
    if (!this.isMongoObjectId(id)) {
      throw ApiError.badRequest('Vehicle ID must be a 24-character hex string (MongoDB ObjectId). This endpoint does not accept VINs.');
    }
    const existing = await this.vehicleRepo.findById(id);
    if (!existing) throw ApiError.notFound('Vehicle not found');
    return this.vehicleRepo.update(id, data as Prisma.VehicleUpdateInput);
  }

  async deleteVehicle(id: string): Promise<void> {
    if (!this.isValidId(id)) throw ApiError.badRequest('Invalid vehicle ID provided');
    if (!this.isMongoObjectId(id)) {
      throw ApiError.badRequest('Vehicle ID must be a 24-character hex string (MongoDB ObjectId). This endpoint does not accept VINs.');
    }
    const existing = await this.vehicleRepo.findById(id);
    if (!existing) throw ApiError.notFound('Vehicle not found');
    await this.vehicleRepo.delete(id);
  }

  /** Get current user's saved vehicles (for Saved tab). */
  async getSavedVehicles(userId: string): Promise<Array<{ vehicle: Vehicle; savedAt: Date }>> {
    return this.savedVehicleRepo.findSavedVehiclesByUserId(userId);
  }

  /** Add vehicle to user's saved list. Vehicle must exist in DB (use save-from-api first for API listings). */
  async addSavedVehicle(userId: string, vehicleId: string): Promise<{ savedAt: Date }> {
    if (!this.isMongoObjectId(vehicleId)) throw ApiError.badRequest('Invalid vehicle ID');
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) throw ApiError.notFound('Vehicle not found');
    const already = await this.savedVehicleRepo.exists(userId, vehicleId);
    if (already) return { savedAt: new Date() };
    const row = await this.savedVehicleRepo.create(userId, vehicleId);
    return { savedAt: row.createdAt };
  }

  /** Remove vehicle from user's saved list. */
  async removeSavedVehicle(userId: string, vehicleId: string): Promise<void> {
    if (!this.isMongoObjectId(vehicleId)) throw ApiError.badRequest('Invalid vehicle ID');
    await this.savedVehicleRepo.deleteByUserAndVehicle(userId, vehicleId);
  }

  async saveVehicleFromApiListing(listing: any, photos: string[] = [], specs?: any): Promise<Vehicle> {
    const vin = listing.vin;
    if (!vin) throw ApiError.badRequest('VIN is required');

    const existing = await this.vehicleRepo.findByVIN(vin);
    if (existing) {
      if (existing.apiSyncStatus === 'PENDING') {
        const [fetchedPhotos, fetchedSpecs] = await Promise.all([
          photos.length > 0 ? Promise.resolve(photos) : this.autoDevService.fetchPhotos(vin).catch(() => []),
          specs || this.autoDevService.fetchSpecifications(vin).catch(() => null),
        ]);
        const vehicleData = VehicleTransformer.fromAutoDevListing(listing, fetchedPhotos, fetchedSpecs);
        vehicleData.apiData = {
          listing,
          specs: fetchedSpecs,
          photos: fetchedPhotos,
          raw: listing,
          syncedAt: new Date().toISOString(),
        };
        vehicleData.lastApiSync = new Date();
        vehicleData.apiSyncStatus = 'SYNCED';
        vehicleData.apiSyncError = null;
        return this.vehicleRepo.update(existing.id, vehicleData as Prisma.VehicleUpdateInput);
      }
      return existing;
    }

    const [fetchedPhotos, fetchedSpecs] = await Promise.all([
      photos.length > 0 ? Promise.resolve(photos) : this.autoDevService.fetchPhotos(vin).catch(() => []),
      specs || this.autoDevService.fetchSpecifications(vin).catch(() => null),
    ]);
    const vehicleData = VehicleTransformer.fromAutoDevListing(listing, fetchedPhotos, fetchedSpecs);
    vehicleData.apiData = {
      listing,
      specs: fetchedSpecs,
      photos: fetchedPhotos,
      raw: listing,
      syncedAt: new Date().toISOString(),
    };
    vehicleData.lastApiSync = new Date();
    vehicleData.apiSyncStatus = 'SYNCED';
    return this.vehicleRepo.create(vehicleData as any);
  }
}
