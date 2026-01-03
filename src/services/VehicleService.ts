import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { VehicleRepository, VehicleFilters, VehiclePagination } from '../repositories/VehicleRepository';
import { AutoDevService } from './AutoDevService';
import { VehicleTransformer } from '../helpers/vehicle-transformer';
import { Vehicle, VehicleSource, Prisma } from '../generated/prisma/client';
import { CreateVehicleDto } from '../validation/dtos/vehicle.dto';
import { ApiError } from '../utils/ApiError';
import loggers from '../utils/loggers';

@injectable()
export class VehicleService {
  constructor(
    @inject(TYPES.VehicleRepository) private vehicleRepo: VehicleRepository,
    @inject(TYPES.AutoDevService) private autoDevService: AutoDevService
  ) {}

  /**
   * Get vehicles with filters and pagination (Hybrid: DB first, API fallback)
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
    fromApi?: number; // Count of vehicles from API (not saved yet)
  }> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    
    // Step 1: Search DB first
    const dbResult = await this.vehicleRepo.findMany(filters, pagination);
    const dbPages = Math.ceil(dbResult.total / limit);

    // Step 2: If DB results are insufficient, fetch from Auto.dev API
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
        if (filters.dealerState) apiFilters.zip = filters.dealerState; // Approximate mapping

        // Fetch from Auto.dev (don't save yet - only return)
        const apiListings = await this.autoDevService.fetchListings({
          ...apiFilters,
          page: 1,
          limit: limit - dbResult.vehicles.length, // Only fetch what we need
        });

        // Transform API listings to Vehicle format (but don't save to DB)
        // Batch check existing VINs to avoid N+1 queries
        const vinsToCheck = apiListings.map(l => l.vin);
        const existingVins = new Set<string>();
        
        // Check which VINs already exist in DB (batch)
        for (const vin of vinsToCheck) {
          const existing = await this.vehicleRepo.findByVIN(vin);
          if (existing) {
            existingVins.add(vin);
          }
        }

        // Transform only new listings (not in DB)
        for (const listing of apiListings) {
          if (!existingVins.has(listing.vin) && apiVehicles.length < (limit - dbResult.vehicles.length)) {
            // Transform but don't save - these are temporary results
            // Don't fetch photos here to save API calls - fetch on-demand when user views
            const vehicleData = VehicleTransformer.fromAutoDevListing(listing, []);
            
            // Store full API response for future compatibility
            vehicleData.apiData = { 
              listing, 
              raw: listing,
              isTemporary: true, // Flag to indicate not saved yet
            };
            vehicleData.apiSyncStatus = 'PENDING'; // Not saved yet
            vehicleData.id = `temp-${listing.vin}`; // Temporary ID for frontend
            
            // Create temporary vehicle object (not persisted)
            apiVehicles.push(vehicleData as Vehicle);
            fromApiCount++;
          }
        }
      } catch (error) {
        loggers.warn('Failed to fetch from Auto.dev API, returning DB results only:', error);
        // Continue with DB results only
      }
    }

    // Step 3: Combine results (DB first, then API)
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
   * Get vehicle by ID (with Auto.dev fallback if not found)
   * Saves vehicle to DB if found in API (user interaction = save trigger)
   */
  async getVehicleById(id: string, vin?: string): Promise<Vehicle> {
    // Try DB first
    let vehicle = await this.vehicleRepo.findById(id);
    
    // If not found and VIN provided, try Auto.dev API
    if (!vehicle && vin) {
      try {
        vehicle = await this.syncFromAutoDev(vin);
        loggers.info(`Vehicle ${vin} synced from Auto.dev and saved to DB`);
      } catch (error) {
        loggers.warn(`Failed to sync vehicle ${vin} from Auto.dev:`, error);
      }
    }

    if (!vehicle) {
      throw ApiError.notFound('Vehicle not found');
    }

    // Increment view count asynchronously
    this.vehicleRepo.incrementViewCount(vehicle.id).catch((err) => {
      loggers.error('Failed to increment view count:', err);
    });

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
   * Update vehicle
   */
  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const existing = await this.vehicleRepo.findById(id);
    if (!existing) {
      throw ApiError.notFound('Vehicle not found');
    }

    return this.vehicleRepo.update(id, data as Prisma.VehicleUpdateInput);
  }

  /**
   * Delete vehicle (soft delete)
   */
  async deleteVehicle(id: string): Promise<void> {
    await this.vehicleRepo.delete(id);
  }

  /**
   * Save vehicle from Auto.dev API listing (called when user interacts with API result)
   * This saves vehicles that users actually view/interact with
   */
  async saveVehicleFromApiListing(listing: any, photos: string[] = [], specs?: any): Promise<Vehicle> {
    // Check if already exists
    const existing = await this.vehicleRepo.findByVIN(listing.vin);
    if (existing) {
      // Update if exists but was temporary
      if (existing.apiSyncStatus === 'PENDING') {
        // Fetch full data if not provided
        const [fetchedPhotos, fetchedSpecs] = await Promise.all([
          photos.length > 0 ? Promise.resolve(photos) : this.autoDevService.fetchPhotos(listing.vin).catch(() => []),
          specs || this.autoDevService.fetchSpecifications(listing.vin).catch(() => null),
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

    // Fetch full data if not provided
    const [fetchedPhotos, fetchedSpecs] = await Promise.all([
      photos.length > 0 ? Promise.resolve(photos) : this.autoDevService.fetchPhotos(listing.vin).catch(() => []),
      specs || this.autoDevService.fetchSpecifications(listing.vin).catch(() => null),
    ]);

    // Transform and save
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

