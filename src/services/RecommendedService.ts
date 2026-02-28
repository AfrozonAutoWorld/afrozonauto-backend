import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { RecommendedDefinitionRepository } from '../repositories/RecommendedDefinitionRepository';
import { AutoDevService } from '../services/AutoDevService';
import { VehicleTransformer } from '../helpers/vehicle-transformer';
import { Vehicle } from '../generated/prisma/client';
import loggers from '../utils/loggers';

const DEFAULT_REASON = 'Near-new, under 15k miles, exceptional condition at this price';

@injectable()
export class RecommendedService {
  constructor(
    @inject(TYPES.RecommendedDefinitionRepository) private recommendedRepo: RecommendedDefinitionRepository,
    @inject(TYPES.AutoDevService) private autoDevService: AutoDevService
  ) {}

  /**
   * Fetch recommended vehicles from Auto.dev per RecommendedDefinition (like Trending).
   * Returns list with reason per vehicle (from definition or default).
   */
  async getFromDefinitions(limit: number = 12): Promise<Array<{ vehicle: Vehicle; reason: string }>> {
    const result: Array<{ vehicle: Vehicle; reason: string }> = [];
    const seenVins = new Set<string>();

    const definitions = await this.recommendedRepo.findManyActive();
    for (const def of definitions) {
      if (result.length >= limit) break;
      try {
        const params: Record<string, string | number> = {
          'vehicle.make': def.make,
          'vehicle.year': `${def.yearStart}-${def.yearEnd}`,
          limit: def.maxFetchCount,
        };
        if (def.model?.trim()) params['vehicle.model'] = def.model.trim();
        const listings = await this.autoDevService.fetchListingsWithParams(params as any);
        const reason = (def.reason?.trim() || DEFAULT_REASON);
        for (const listing of listings) {
          const vin = (listing as any).vin || (listing as any).vehicle?.vin;
          if (vin && !seenVins.has(vin)) {
            seenVins.add(vin);
            const vehicleData = VehicleTransformer.fromAutoDevListing(listing, []);
            vehicleData.apiData = { listing, raw: listing, isTemporary: true };
            vehicleData.apiSyncStatus = 'PENDING';
            (vehicleData as any).id = `temp-${vin}`;
            result.push({ vehicle: vehicleData as Vehicle, reason });
            if (result.length >= limit) break;
          }
        }
      } catch (e) {
        loggers.warn(
          `RecommendedService: failed for ${def.make} ${def.model || ''} ${def.yearStart}-${def.yearEnd}`,
          e
        );
      }
    }
    return result;
  }
}
