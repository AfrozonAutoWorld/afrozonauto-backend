import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { VehicleRepository, VehicleFilters, VehiclePagination } from '../repositories/VehicleRepository';
import { AutoDevService } from './AutoDevService';
import { RedisCacheService } from './RedisCacheService';
import { VehicleTransformer } from '../helpers/vehicle-transformer';
import { VehicleLogs } from '../helpers/vehicleLogs';
import { Vehicle, VehicleSource, Prisma } from '../generated/prisma/client';
import { CreateVehicleDto } from '../validation/dtos/vehicle.dto';
import { ApiError } from '../utils/ApiError';
import loggers from '../utils/loggers';

@injectable()
export class VehicleService {
  private readonly cacheTTLHours: number;

  constructor(
    @inject(TYPES.VehicleRepository) private vehicleRepo: VehicleRepository,
    @inject(TYPES.AutoDevService) private autoDevService: AutoDevService,
    @inject(TYPES.RedisCacheService) private cache: RedisCacheService
  ) {
    // Get cache TTL in hours (default 12)
    this.cacheTTLHours = parseInt(process.env.REDIS_CACHE_TTL_HOURS || '12', 10);
  }

  /**
   * Check if vehicle price data is stale (needs refresh)
   */
  private isPriceStale(vehicle: Vehicle): boolean {
    if (!vehicle.lastApiSync || vehicle.source !== VehicleSource.API) {
      return false; // Manual vehicles don't need price refresh
    }

    const now = new Date();
    const lastSync = new Date(vehicle.lastApiSync);
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceSync >= this.cacheTTLHours;
  }

  /**
   * Refresh vehicle price from cache/API if stale
   * Updates price in DB and adds to priceHistory if changed
   */
  private async refreshVehiclePrice(vehicle: Vehicle): Promise<Vehicle | null> {
    if (!vehicle.vin || !this.isPriceStale(vehicle)) {
      return null; // Not stale or no VIN
    }

    const oldPrice = vehicle.priceUsd;
    const lastSync = vehicle.lastApiSync ? new Date(vehicle.lastApiSync).toISOString() : 'never';
    const hoursStale = vehicle.lastApiSync 
      ? ((new Date().getTime() - new Date(vehicle.lastApiSync).getTime()) / (1000 * 60 * 60)).toFixed(1)
      : 'unknown';

    try {
      // Check cache first
      const cacheKey = RedisCacheService.getVehicleByVINKey(vehicle.vin);
      const cachedListing = await this.cache.get<any>(cacheKey);

      let listing: any = null;
      let dataSource: 'cache' | 'api' = 'api';

      if (cachedListing?.listing) {
        listing = cachedListing.listing;
        dataSource = 'cache';
      } else {
        // Fetch from API
        listing = await this.autoDevService.fetchListingByVIN(vehicle.vin);
        if (listing) {
          // Cache it
          await this.cache.set(cacheKey, { listing });
          dataSource = 'api';
        }
      }

      if (!listing || !listing.price) {
        return null; // No price data available
      }

      const newPrice = listing.price;
      const priceDiff = newPrice - oldPrice;
      const priceDiffPercent = ((priceDiff / oldPrice) * 100).toFixed(2);
      const priceChangeDirection = priceDiff > 0 ? 'INCREASE' : priceDiff < 0 ? 'DECREASE' : 'NO_CHANGE';

      // Only update if price changed
      if (Math.abs(priceDiff) > 0.01) { // Allow for floating point precision
        const priceHistory = Array.isArray(vehicle.priceHistory) 
          ? [...vehicle.priceHistory] 
          : [];

        // Add to price history
        const historyEntry = {
          date: new Date().toISOString(),
          price: newPrice,
          previousPrice: oldPrice,
          priceChange: priceDiff,
          priceChangePercent: parseFloat(priceDiffPercent),
          reason: 'API_PRICE_UPDATE',
          source: 'autodev',
          dataSource, // 'cache' or 'api'
        };
        priceHistory.push(historyEntry);

        // Update vehicle with new price
        const updateData: Prisma.VehicleUpdateInput = {
          priceUsd: newPrice,
          priceHistory: priceHistory as any, // Cast to satisfy Prisma JSON type
          lastApiSync: new Date(),
          apiSyncStatus: 'SYNCED',
          apiSyncError: null,
          // Update apiData with fresh listing
          apiData: {
            ...(vehicle.apiData as any || {}),
            listing,
            raw: listing,
            syncedAt: new Date().toISOString(),
          } as any,
        };

        const updated = await this.vehicleRepo.update(vehicle.id, updateData);
        
        // Log to ActivityLog table (database)
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
          dataSource,
          lastSync: vehicle.lastApiSync?.toISOString(),
          hoursStale: hoursStale,
          priceHistoryCount: priceHistory.length,
        });
        
        return updated;
      } else {
        // Price unchanged, just update lastApiSync
        await this.vehicleRepo.update(vehicle.id, {
          lastApiSync: new Date(),
          apiSyncStatus: 'SYNCED',
        });

        // Log price refresh (even if unchanged) to ActivityLog
        await VehicleLogs.logPriceRefresh(vehicle, {
          vin: vehicle.vin,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          price: oldPrice,
          dataSource,
          lastSync: vehicle.lastApiSync?.toISOString(),
          hoursStale: hoursStale,
          status: 'unchanged',
        });
        
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Mark as outdated but don't fail the request
      await this.vehicleRepo.update(vehicle.id, {
        apiSyncStatus: 'OUTDATED',
        apiSyncError: errorMessage,
      }).catch(() => {});

      // Log failure to ActivityLog
      await VehicleLogs.logPriceRefreshFailed(vehicle, {
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        currentPrice: oldPrice,
        error: errorMessage,
        lastSync: vehicle.lastApiSync?.toISOString(),
        hoursStale: hoursStale,
        status: 'failed',
      });
      
      return null;
    }
  }

  /**
   * Get vehicles with filters and pagination (Hybrid: DB first, Redis cache, API fallback)
   * API responses are cached in Redis (12hr TTL) to handle price changes and reduce API calls
   * Vehicles are only saved to DB when user initiates payment
   */
  async getVehicles(
    filters: VehicleFilters,
    pagination: VehiclePagination = {},
    includeApiResults: boolean = true
  ): Promise<{ 
    vehicles: Vehicle[]; 
    total: number; 
    page: number; 
    limit: number; 
    pages: number;
    fromApi?: number; // Count of vehicles from API (cached, not saved to DB)
  }> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    
    // Step 1: Search DB first
    const dbResult = await this.vehicleRepo.findMany(filters, pagination);

    // Step 1.5: Refresh prices for stale vehicles in DB (async, non-blocking)
    const staleVehicles = dbResult.vehicles.filter(v => this.isPriceStale(v));
    
    const priceRefreshPromises = staleVehicles.map(v => 
      this.refreshVehiclePrice(v).catch(() => null)
    );
    
    // Don't await - let it run in background, but refresh the vehicles we return
    Promise.all(priceRefreshPromises).catch(() => {});

    // Step 2: If DB results are insufficient, check Redis cache, then Auto.dev API
    let apiVehicles: Vehicle[] = [];
    let fromApiCount = 0;

    if (includeApiResults && dbResult.vehicles.length < limit) {
      try {
        // Map our filters to Auto.dev API filters
        const apiFilters: any = {};
        if (filters.make) apiFilters.make = filters.make;
        if (filters.model) apiFilters.model = filters.model;
        if (filters.yearMin || filters.yearMax) {
          if (filters.yearMin && filters.yearMax && filters.yearMin === filters.yearMax) {
            apiFilters.year = filters.yearMin;
          } else if (filters.yearMin) {
            apiFilters.year = filters.yearMin;
          }
        }
        if (filters.dealerState) apiFilters.zip = filters.dealerState;

        // Check Redis cache first
        const cacheKey = RedisCacheService.getVehicleListingsKey({ ...apiFilters, page, limit });
        const cachedResult = await this.cache.get<{ listings: any[]; total: number }>(cacheKey);

        let apiListings: any[] = [];
        
        if (cachedResult) {
          // Use cached results
          loggers.info(`Using cached vehicle listings for filters: ${JSON.stringify(apiFilters)}`);
          apiListings = cachedResult.listings;
        } else {
          // Fetch from Auto.dev API
          apiListings = await this.autoDevService.fetchListings({
            ...apiFilters,
            page: 1,
            limit: limit - dbResult.vehicles.length,
          });

          // Cache the API response (12hr TTL handles price changes)
          await this.cache.set(cacheKey, {
            listings: apiListings,
            total: apiListings.length,
          });
          loggers.info(`Cached vehicle listings for filters: ${JSON.stringify(apiFilters)}`);
        }

        // Batch check existing VINs to avoid N+1 queries
        const vinsToCheck = apiListings.map(l => l.vin);
        const existingVins = new Set<string>();
        
        for (const vin of vinsToCheck) {
          const existing = await this.vehicleRepo.findByVIN(vin);
          if (existing) {
            existingVins.add(vin);
          }
        }

        // Transform only new listings (not in DB)
        for (const listing of apiListings) {
          if (!existingVins.has(listing.vin) && apiVehicles.length < (limit - dbResult.vehicles.length)) {
            // Transform but don't save to DB - cache only
            const vehicleData = VehicleTransformer.fromAutoDevListing(listing, []);
            
            vehicleData.apiData = { 
              listing, 
              raw: listing,
              isTemporary: true, // Flag to indicate not saved to DB yet
              cached: true, // Flag to indicate from cache
            };
            vehicleData.apiSyncStatus = 'PENDING'; // Not saved to DB yet
            vehicleData.id = `temp-${listing.vin}`; // Temporary ID for frontend
            
            apiVehicles.push(vehicleData as Vehicle);
            fromApiCount++;
          }
        }
      } catch (error) {
        loggers.warn('Failed to fetch from Auto.dev API, returning DB results only:', error);
      }
    }

    // Step 3: Combine results (DB first, then cached API)
    const allVehicles = [...dbResult.vehicles, ...apiVehicles];
    const total = dbResult.total + fromApiCount;
    const pages = Math.ceil(total / limit);

    return {
      vehicles: allVehicles,
      total,
      page,
      limit,
      pages,
      fromApi: fromApiCount,
    };
  }

  /**
   * Get vehicle by ID (with Redis cache and Auto.dev fallback)
   * Refreshes price if stale (older than cache TTL)
   * Does NOT save new vehicles to DB - only returns cached/API data
   * Vehicle is saved to DB only when payment is initiated
   */
  async getVehicleById(id: string, vin?: string): Promise<Vehicle> {
    // Check if ID is null, empty, or invalid (like ":id" route parameter)
    const hasValidId = this.isValidId(id);
    const isTemporaryId = hasValidId && id.startsWith('temp-');
    let extractedVin: string | undefined;
    
    if (isTemporaryId) {
      // Extract VIN from temporary ID (format: "temp-{VIN}")
      extractedVin = id.replace(/^temp-/, '');
    } else if (hasValidId) {
      // Try DB first for valid IDs
      try {
        let vehicle = await this.vehicleRepo.findById(id);
        
        // If found in DB, check if price needs refresh
        if (vehicle && this.isPriceStale(vehicle)) {
          const refreshed = await this.refreshVehiclePrice(vehicle);
          if (refreshed) {
            vehicle = refreshed;
          }
        }
        
        if (vehicle) {
          // Increment view count asynchronously
          this.vehicleRepo.incrementViewCount(vehicle.id).catch((err) => {
            loggers.error('Failed to increment view count:', err);
          });
          return vehicle;
        }
      } catch (error) {
        // If DB lookup fails (e.g., invalid ObjectID), log and continue to VIN lookup
        loggers.warn(`Failed to lookup vehicle by ID ${id}, falling back to VIN lookup:`, error);
      }
    }
    // Use extracted VIN from temporary ID, or fall back to provided vin parameter
    const vinToUse = extractedVin || vin;
    
    // If not found in DB (or temporary ID), try cache, then API (but don't save to DB)
    let vehicle: Vehicle | null = null;
    
    if (vinToUse) {
      // Check Redis cache first
      const cacheKey = RedisCacheService.getVehicleByVINKey(vinToUse);
      const cachedVehicle = await this.cache.get<any>(cacheKey);
      
      if (cachedVehicle) {
        loggers.info(`Using cached vehicle data for VIN: ${vinToUse}`);
        vehicle = cachedVehicle as Vehicle;
      } else {
        // Fetch from Auto.dev API and cache it (don't save to DB)
        try {
          const [listing, photos, specs] = await Promise.all([
            this.autoDevService.fetchListingByVIN(vinToUse),
            this.autoDevService.fetchPhotos(vinToUse),
            this.autoDevService.fetchSpecifications(vinToUse),
          ]);

          if (listing) {
            const vehicleData = VehicleTransformer.fromAutoDevListing(listing, photos, specs);
            vehicleData.apiData = {
              listing,
              specs,
              photos,
              raw: listing,
              cached: true,
              isTemporary: true,
            };
            vehicleData.apiSyncStatus = 'PENDING';
            vehicleData.id = `temp-${vinToUse}`;
            
            // Cache the vehicle data (12hr TTL)
            await this.cache.set(cacheKey, vehicleData);
            loggers.info(`Cached vehicle data for VIN: ${vinToUse}`);
            
            vehicle = vehicleData as Vehicle;
          }
        } catch (error) {
          loggers.warn(`Failed to fetch vehicle ${vinToUse} from Auto.dev:`, error);
        }
      }
    }

    if (!vehicle) {
      throw ApiError.notFound('Vehicle not found');
    }

    // Increment view count asynchronously (only if in DB)
    if (vehicle.id && !vehicle.id.startsWith('temp-')) {
      this.vehicleRepo.incrementViewCount(vehicle.id).catch((err) => {
        loggers.error('Failed to increment view count:', err);
      });
    }

    return vehicle;
  }

  /**
   * Get vehicle by VIN
   */
  async getVehicleByVIN(vin: string): Promise<Vehicle | null> {
    return this.vehicleRepo.findByVIN(vin);
  }

  /**
   * Create vehicle from manual entry
   */
  async createVehicle(dto: CreateVehicleDto, addedBy?: string): Promise<Vehicle> {
    // Check if VIN already exists
    const existing = await this.vehicleRepo.findByVIN(dto.vin);
    if (existing) {
      throw ApiError.conflict('Vehicle with this VIN already exists');
    }

    return this.vehicleRepo.create({
      ...dto,
      source: dto.source || VehicleSource.MANUAL,
      addedBy,
      isActive: dto.isActive !== false,
      isHidden: dto.isHidden || false,
    });
  }

  /**
   * Sync vehicle from Auto.dev API
   */
  async syncFromAutoDev(vin: string): Promise<Vehicle> {
    const existing = await this.vehicleRepo.findByVIN(vin);
    
    try {
      // Fetch from Auto.dev
      const [listing, photos, specs] = await Promise.all([
        this.autoDevService.fetchListingByVIN(vin),
        this.autoDevService.fetchPhotos(vin),
        this.autoDevService.fetchSpecifications(vin),
      ]);

      if (!listing) {
        // Mark as failed if vehicle exists, otherwise throw error
        if (existing) {
          await this.vehicleRepo.update(existing.id, {
            apiSyncStatus: 'FAILED',
            apiSyncError: 'Vehicle not found in Auto.dev',
          });
        }
        throw ApiError.notFound('Vehicle not found in Auto.dev');
      }

      // Transform to our model
      const vehicleData = VehicleTransformer.fromAutoDevListing(listing, photos, specs);
      // Store FULL API response for future compatibility (handles API field changes)
      vehicleData.apiData = { 
        listing, 
        specs,
        photos,
        raw: listing, // Store complete raw response
        syncedAt: new Date().toISOString(),
      };
      vehicleData.lastApiSync = new Date();
      vehicleData.apiSyncStatus = 'SYNCED';
      vehicleData.apiSyncError = null; // Clear any previous errors

      if (existing) {
        // Update existing
        return this.vehicleRepo.update(existing.id, vehicleData as Prisma.VehicleUpdateInput);
      } else {
        // Create new
        return this.vehicleRepo.create(vehicleData as any);
      }
    } catch (error: any) {
      loggers.error('Failed to sync vehicle from Auto.dev:', error);
      
      // Update status to FAILED if vehicle exists
      if (existing) {
        await this.vehicleRepo.update(existing.id, {
          apiSyncStatus: 'FAILED',
          apiSyncError: error.message || 'Failed to sync from Auto.dev API',
        });
      }
      
      throw ApiError.badGateway('Failed to sync vehicle from Auto.dev API');
    }
  }

  /**
   * Check if ID is valid (not null, empty, or invalid route parameter)
   */
  private isValidId(id: string): boolean {
    return !!(id && id.trim() && !id.startsWith(':') && id !== 'null' && id !== 'undefined');
  }

  /**
   * Update vehicle
   */
  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    if (!this.isValidId(id)) {
      throw ApiError.badRequest('Invalid vehicle ID provided');
    }

    try {
      const existing = await this.vehicleRepo.findById(id);
      if (!existing) {
        throw ApiError.notFound('Vehicle not found');
      }

      return this.vehicleRepo.update(id, data as Prisma.VehicleUpdateInput);
    } catch (error: any) {
      // If Prisma error due to invalid ObjectID format
      if (error.code === 'P2023' || error.message?.includes('Malformed ObjectID')) {
        throw ApiError.badRequest('Invalid vehicle ID format');
      }
      throw error;
    }
  }

  /**
   * Delete vehicle (soft delete)
   */
  async deleteVehicle(id: string): Promise<void> {
    if (!this.isValidId(id)) {
      throw ApiError.badRequest('Invalid vehicle ID provided');
    }

    try {
      await this.vehicleRepo.delete(id);
    } catch (error: any) {
      // If Prisma error due to invalid ObjectID format
      if (error.code === 'P2023' || error.message?.includes('Malformed ObjectID')) {
        throw ApiError.badRequest('Invalid vehicle ID format');
      }
      throw error;
    }
  }

  /**
   * Save vehicle from Auto.dev API to DB (called when user initiates payment)
   * This is the ONLY place where vehicles are saved to DB from API
   * Payment initiation = save trigger
   */
  async saveVehicleFromApiListing(listing: any, photos: string[] = [], specs?: any): Promise<Vehicle> {
    const vin = listing.vin;
    if (!vin) {
      throw ApiError.badRequest('VIN is required');
    }

    // Check if already exists in DB
    const existing = await this.vehicleRepo.findByVIN(vin);
    if (existing) {
      // Update if exists but was temporary/pending
      if (existing.apiSyncStatus === 'PENDING') {
        // Fetch full data if not provided
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

        // Invalidate cache for this vehicle
        await this.cache.delete(RedisCacheService.getVehicleByVINKey(vin));
        await this.cache.deleteByPattern('vehicle:listings:*'); // Invalidate listings cache

        return this.vehicleRepo.update(existing.id, vehicleData as Prisma.VehicleUpdateInput);
      }
      return existing;
    }

    // Fetch full data if not provided
    const [fetchedPhotos, fetchedSpecs] = await Promise.all([
      photos.length > 0 ? Promise.resolve(photos) : this.autoDevService.fetchPhotos(vin).catch(() => []),
      specs || this.autoDevService.fetchSpecifications(vin).catch(() => null),
    ]);

    // Transform and save to DB
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

    // Invalidate cache
    await this.cache.delete(RedisCacheService.getVehicleByVINKey(vin));
    await this.cache.deleteByPattern('vehicle:listings:*');

    return this.vehicleRepo.create(vehicleData as any);
  }
}

