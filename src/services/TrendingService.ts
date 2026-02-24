import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { OrderRepository } from '../repositories/OrderRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { TrendingDefinitionRepository } from '../repositories/TrendingDefinitionRepository';
import { AutoDevService } from '../services/AutoDevService';
import { VehicleTransformer } from '../helpers/vehicle-transformer';
import { Vehicle } from '../generated/prisma/client';
import loggers from '../utils/loggers';

const MAX_ORDERED_VEHICLES = 15;

@injectable()
export class TrendingService {
  constructor(
    @inject(TYPES.OrderRepository) private orderRepo: OrderRepository,
    @inject(TYPES.VehicleRepository) private vehicleRepo: VehicleRepository,
    @inject(TYPES.TrendingDefinitionRepository) private trendingRepo: TrendingDefinitionRepository,
    @inject(TYPES.AutoDevService) private autoDevService: AutoDevService
  ) {}

  /**
   * Get trending vehicles: (1) vehicles people ordered, (2) upto maxFetchCount per trending rule from Auto.dev.
   */
  async getTrendingVehicles(): Promise<Vehicle[]> {
    const result: Vehicle[] = [];
    const seenVins = new Set<string>();

    // 1. Vehicles from orders (most ordered first)
    try {
      const orderedVehicleIds = await this.orderRepo.findOrderedVehicleIds(MAX_ORDERED_VEHICLES);
      const orderedVehicles = await this.vehicleRepo.findManyByIds(orderedVehicleIds);
      for (const v of orderedVehicles) {
        if (v.vin && !seenVins.has(v.vin)) {
          seenVins.add(v.vin);
          result.push(v);
        }
      }
    } catch (e) {
      loggers.warn('TrendingService: failed to load ordered vehicles', e);
    }

    // 2. Curated: up to maxFetchCount per trending definition from Auto.dev
    const definitions = await this.trendingRepo.findManyActive();
    for (const def of definitions) {
      try {
        const params: Record<string, string | number> = {
          'vehicle.make': def.make,
          'vehicle.year': `${def.yearStart}-${def.yearEnd}`,
          limit: def.maxFetchCount,
        };
        if (def.model?.trim()) params['vehicle.model'] = def.model.trim();
        const listings = await this.autoDevService.fetchListingsWithParams(params as any);
        for (const listing of listings) {
          const vin = (listing as any).vin || (listing as any).vehicle?.vin;
          if (vin && !seenVins.has(vin)) {
            seenVins.add(vin);
            const vehicleData = VehicleTransformer.fromAutoDevListing(listing, []);
            vehicleData.apiData = { listing, raw: listing, isTemporary: true };
            vehicleData.apiSyncStatus = 'PENDING';
            vehicleData.id = `temp-${vin}`;
            result.push(vehicleData as Vehicle);
          }
        }
      } catch (e) {
        loggers.warn(`TrendingService: failed for rule ${def.make} ${def.model || ''} ${def.yearStart}-${def.yearEnd}`, e);
      }
    }

    return result;
  }

  async getMaxFetchCount(): Promise<number> {
    const defs = await this.trendingRepo.findManyActive() as any[];
    if (!defs.length) return 1;
    const values = defs
      .map((d) => (typeof d.maxFetchCount === 'number' && d.maxFetchCount > 0 ? d.maxFetchCount : 1));
    return values.length ? Math.max(...values) : 1;
  }
}
