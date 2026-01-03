import { Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { VehicleService } from '../services/VehicleService';
import { AuthenticatedRequest } from '../types/customRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { VehicleFilters } from '../repositories/VehicleRepository';
import { UserRole } from '../generated/prisma/client';

@injectable()
export class VehicleController {
  constructor(
    @inject(TYPES.VehicleService) private vehicleService: VehicleService
  ) {}

  /**
   * GET /api/vehicles
   * Get list of vehicles with filters (DB first, API fallback)
   * Query param: includeApi=true/false (default: true) - whether to include API results
   */
  getVehicles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters: VehicleFilters = {
      make: req.query.make as string,
      model: req.query.model as string,
      yearMin: req.query.yearMin ? parseInt(req.query.yearMin as string) : undefined,
      yearMax: req.query.yearMax ? parseInt(req.query.yearMax as string) : undefined,
      priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
      priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
      mileageMax: req.query.mileageMax ? parseInt(req.query.mileageMax as string) : undefined,
      vehicleType: req.query.vehicleType as any,
      status: req.query.status as any,
      dealerState: req.query.state as string,
      featured: req.query.featured === 'true',
      search: req.query.search as string,
    };

    const pagination = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    };

    const includeApi = req.query.includeApi !== 'false';

    const result = await this.vehicleService.getVehicles(filters, pagination, includeApi);

    res.json(
      ApiResponse.paginated(
        result.vehicles,
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages,
          fromApi: result.fromApi || 0,
        },
        'Vehicles retrieved successfully'
      )
    );
  });

  /**
   * GET /api/vehicles/:id
   * Get vehicle by ID (with Auto.dev fallback if not found)
   * Query param: vin=XXX - Optional VIN to try Auto.dev if ID not found
   */
  getVehicleById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const vin = req.query.vin as string;
    
    const vehicle = await this.vehicleService.getVehicleById(id, vin);
    res.json(ApiResponse.success(vehicle, 'Vehicle retrieved successfully'));
  });

  /**
   * POST /api/vehicles
   * Create vehicle (Admin only)
   */
  createVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.role !== UserRole.OPERATIONS_ADMIN) {
      throw ApiError.forbidden('Only admins can create vehicles');
    }

    const vehicle = await this.vehicleService.createVehicle(
      req.body,
      req.user?.id
    );

    res.status(201).json(
      ApiResponse.created(vehicle, 'Vehicle created successfully')
    );
  });

  /**
   * POST /api/vehicles/sync/:vin
   * Sync vehicle from Auto.dev API
   */
  syncVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { vin } = req.params;
    
    if (!vin || vin.length !== 17) {
      throw ApiError.badRequest('Invalid VIN. Must be 17 characters');
    }

    const vehicle = await this.vehicleService.syncFromAutoDev(vin);
    res.json(ApiResponse.success(vehicle, 'Vehicle synced successfully'));
  });

  /**
   * PUT /api/vehicles/:id
   * Update vehicle (Admin only)
   */
  updateVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.role !== UserRole.OPERATIONS_ADMIN) {
      throw ApiError.forbidden('Only admins can update vehicles');
    }
    const { id } = req.params;
    const vehicle = await this.vehicleService.updateVehicle(id, req.body);
    res.json(ApiResponse.success(vehicle, 'Vehicle updated successfully'));
  });

  /**
   * DELETE /api/vehicles/:id
   * Delete vehicle (Admin only)
   */
  deleteVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.role !== UserRole.OPERATIONS_ADMIN) {
      throw ApiError.forbidden('Only admins can delete vehicles');
    }
    const { id } = req.params;
    await this.vehicleService.deleteVehicle(id);
    res.json(ApiResponse.success(null, 'Vehicle deleted successfully'));
  });

  /**
   * POST /api/vehicles/save-from-api
   * Save a vehicle from Auto.dev API result (when user interacts with API vehicle)
   * Body: { vin, listing, photos?, specs? }
   */
  saveVehicleFromApi = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { vin, listing, photos, specs } = req.body;

    if (!vin || !listing) {
      throw ApiError.badRequest('VIN and listing are required');
    }

    const vehicle = await this.vehicleService.saveVehicleFromApiListing(
      listing,
      photos || [],
      specs
    );

    res.status(201).json(
      ApiResponse.created(vehicle, 'Vehicle saved from API successfully')
    );
  });
}

