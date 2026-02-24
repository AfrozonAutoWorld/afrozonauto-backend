import { Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { VehicleServiceDirect } from '../services/VehicleServiceDirect';
import { CategoryService } from '../services/CategoryService';
import { AuthenticatedRequest } from '../types/customRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { VehicleFilters } from '../repositories/VehicleRepository';
import { UserRole } from '../generated/prisma/client';

@injectable()
export class VehicleController {
  constructor(
    @inject(TYPES.VehicleService) private vehicleService: VehicleServiceDirect,
    @inject(TYPES.CategoryService) private categoryService: CategoryService
  ) { }

  /**
   * GET /api/vehicles/trending
   * Trending vehicles: ordered first, then 5 per trending rule from Auto.dev
   */
  getTrending = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const vehicles = await this.vehicleService.getTrendingVehicles();
    return res.json(ApiResponse.success(vehicles, 'Trending vehicles retrieved successfully'));
  });

  /**
   * GET /api/vehicles/categories
   * List active categories for filtering (Electric, SUV, Sedan, etc.)
   */
  getCategories = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const categories = await this.categoryService.listCategories();
    return res.json(ApiResponse.success(categories, 'Categories retrieved successfully'));
  });

  /**
   * GET /api/vehicles/reference/models
   * Proxy Auto.dev models reference (make -> models). Cached in AutoDevService.
   */
  getMakeModelsReference = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const data = await this.vehicleService.getMakeModelsReference();
    return res.json(ApiResponse.success(data, 'Make/models reference retrieved successfully'));
  });

  /**
   * GET /api/vehicles
   * Get list of vehicles with filters (DB first, API)
   * Query param: includeApi=true/false (default: true) - whether to include API results
   */
  getVehicles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = req.query;
    const str = (v: unknown) => {
      const s = Array.isArray(v) ? v[0] : v;
      return typeof s === 'string' && s.trim() !== '' ? s.trim() : undefined;
    };
    const filters: VehicleFilters = {};
    if (str(q.make)) filters.make = str(q.make);
    if (str(q.model)) filters.model = str(q.model);
    const yearMin = q.yearMin ? parseInt(q.yearMin as string, 10) : undefined;
    const yearMax = q.yearMax ? parseInt(q.yearMax as string, 10) : undefined;
    if (Number.isFinite(yearMin)) filters.yearMin = yearMin;
    if (Number.isFinite(yearMax)) filters.yearMax = yearMax;
    const priceMin = q.priceMin ? parseFloat(q.priceMin as string) : undefined;
    const priceMax = q.priceMax ? parseFloat(q.priceMax as string) : undefined;
    if (Number.isFinite(priceMin)) filters.priceMin = priceMin;
    if (Number.isFinite(priceMax)) filters.priceMax = priceMax;
    const mileageMax = q.mileageMax ? parseInt(q.mileageMax as string, 10) : undefined;
    if (Number.isFinite(mileageMax)) filters.mileageMax = mileageMax;
    if (str(q.vehicleType)) filters.vehicleType = str(q.vehicleType) as VehicleFilters['vehicleType'];
    if (str(q.status)) filters.status = str(q.status) as VehicleFilters['status'];
    if (str(q.state)) filters.dealerState = str(q.state);
    if (q.featured !== undefined && q.featured !== '') filters.featured = q.featured === 'true';
    if (str(q.search)) filters.search = str(q.search);

    const pagination = {
      page: Math.max(1, q.page ? parseInt(q.page as string, 10) : 1),
      limit: Math.min(100, Math.max(1, q.limit ? parseInt(q.limit as string, 10) : 50)),
    };

    const includeApi = req.query.includeApi !== 'false';
    const categorySlug = str(q.category);

    const result = await this.vehicleService.getVehicles(filters, pagination, includeApi, categorySlug);

    return res.json(
      ApiResponse.paginated(
        result.vehicles,
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages,
          fromApi: result.fromApi || 0,
          hasMore: result.hasMore ?? (result.vehicles.length === result.limit),
        },
        'Vehicles retrieved successfully'
      )
    );
  });

  /**
   * GET /api/vehicles/:identifier
   * Get vehicle by ID or VIN
   * Query param: type="id" | "vin" (default: "id")
   * Flow: 
   *   - type="id": DB → Redis → API
   *   - type="vin": Redis → API
   * Does NOT save to DB - only returns cached/API data
   */
  getVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { identifier } = req.params;
    let raw = req.query?.type;
    const typeParam = (Array.isArray(raw) ? raw[0] : raw) || '';
    let type: 'id' | 'vin' = typeParam?.toString().trim().toLowerCase() === 'vin' ? 'vin' : 'vin';
    if (identifier.startsWith('temp-')) {
      type = 'id';
    }
    if (!identifier) {
      return res.json(
        ApiError.badRequest('Vehicle identifier is required')
      )
    }

    const vehicle = await this.vehicleService.getVehicle(identifier, type);
    return res.json(ApiResponse.success(vehicle, 'Vehicle retrieved successfully'));
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

    return res.status(201).json(
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
    return res.json(ApiResponse.success(vehicle, 'Vehicle synced successfully'));
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
    return res.json(ApiResponse.success(null, 'Vehicle deleted successfully'));
  });

  /**
   * POST /api/vehicles/save-from-api
   * Save a vehicle from Auto.dev API to DB (called when user initiates payment)
   * This is the ONLY endpoint that saves API vehicles to DB
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

    return res.status(201).json(
      ApiResponse.created(vehicle, 'Vehicle saved from API successfully')
    );
  });
}

