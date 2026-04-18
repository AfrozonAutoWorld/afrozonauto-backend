import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { TrendingDefinitionRepository } from '../repositories/TrendingDefinitionRepository';
import { AutoDevService } from './AutoDevService';
import { RedisCacheService } from './RedisCacheService';
import { VehicleTransformer } from '../helpers/vehicle-transformer';
import { TrendingDefinition, Vehicle } from '../generated/prisma/client';
import loggers from '../utils/loggers';

/** Max DB featured rows before Auto.dev trending-definition fills. */
const FEATURED_TRENDING_POOL = 300;

@injectable()
export class TrendingService {
  constructor(
    @inject(TYPES.VehicleRepository) private readonly vehicleRepo: VehicleRepository,
    @inject(TYPES.TrendingDefinitionRepository)
    private readonly trendingRepo: TrendingDefinitionRepository,
    @inject(TYPES.AutoDevService) private readonly autoDevService: AutoDevService,
    @inject(TYPES.RedisCacheService) private readonly redisCache: RedisCacheService
  ) {}

  /**
   * Home / featured rail:
   * (1) DB vehicles with `featured === true` (and valid featured window),
   * (2) then Auto.dev listings per active {@link TrendingDefinition} (deduped by VIN).
   * Does not merge order-popularity.
   */
  async getTrendingVehicles(): Promise<Vehicle[]> {
    const result: Vehicle[] = [];
    const seenVins = new Set<string>();

    const pushByVin = (v: Vehicle) => {
      if (!v.vin || seenVins.has(v.vin)) return;
      seenVins.add(v.vin);
      result.push(v);
    };

    try {
      const featured = await this.vehicleRepo.findFeaturedForHomeTrending(FEATURED_TRENDING_POOL);
      for (const v of featured) pushByVin(v);
    } catch (e) {
      loggers.warn('TrendingService: failed to load featured vehicles', e);
    }

    const definitions = await this.trendingRepo.findManyActive();
    for (const def of definitions) {
      try {
        await this.appendDefinitionListings(def, seenVins, result);
      } catch (e) {
        loggers.warn(
          `TrendingService: failed for rule ${def.make} ${def.model || ''} ${def.yearStart}-${def.yearEnd}`,
          e
        );
      }
    }

    return result;
  }

  private async appendDefinitionListings(
    def: TrendingDefinition,
    seenVins: Set<string>,
    result: Vehicle[]
  ): Promise<void> {
    const params: Record<string, string | number> = {
      'vehicle.make': def.make,
      'vehicle.year': `${def.yearStart}-${def.yearEnd}`,
      limit: typeof def.maxFetchCount === 'number' && def.maxFetchCount > 0 ? def.maxFetchCount : 5,
    };
    if (def.model?.trim()) params['vehicle.model'] = def.model.trim();
    const listings = await this.autoDevService.fetchListingsWithParams(params as any);
    for (const listing of listings) {
      const vin = (listing as any).vin || (listing as any).vehicle?.vin;
      if (!vin || seenVins.has(vin)) continue;
      seenVins.add(vin);
      const vehicleData = VehicleTransformer.fromAutoDevListing(listing, []);
      vehicleData.apiData = { listing, raw: listing, isTemporary: true };
      vehicleData.apiSyncStatus = 'PENDING';
      vehicleData.id = await this.redisCache.registerTempVehiclePublicId(vin);
      result.push(vehicleData as Vehicle);
    }
  }
}
