import { getPrismaClient } from '../db/prisma';
import { Vehicle } from '../generated/prisma/client';

interface PriceUpdateMetadata {
  vin: string;
  make: string;
  model: string;
  year: number;
  oldPrice: number;
  newPrice: number;
  priceChange: number;
  priceChangePercent: number;
  direction: 'INCREASE' | 'DECREASE' | 'NO_CHANGE';
  dataSource: 'cache' | 'api';
  lastSync?: string | null;
  hoursStale: string;
  priceHistoryCount: number;
}

interface PriceRefreshMetadata {
  vin: string;
  make: string;
  model: string;
  year: number;
  price: number;
  dataSource: 'cache' | 'api';
  lastSync?: string | null;
  hoursStale: string;
  status: 'unchanged';
}

interface PriceRefreshFailedMetadata {
  vin: string;
  make: string;
  model: string;
  year: number;
  currentPrice: number;
  error: string;
  lastSync?: string | null;
  hoursStale: string;
  status: 'failed';
}

/**
 * Helper functions for logging vehicle-related activities to ActivityLog
 */
export class VehicleLogs {
  /**
   * Log vehicle price update to ActivityLog
   */
  static async logPriceUpdate(
    vehicle: Vehicle,
    metadata: PriceUpdateMetadata
  ): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const priceChangeDirection = metadata.direction;
      const oldPriceFormatted = `$${metadata.oldPrice.toLocaleString()}`;
      const newPriceFormatted = `$${metadata.newPrice.toLocaleString()}`;
      const priceDiffPercent = metadata.priceChangePercent.toFixed(2);

      await prisma.activityLog.create({
        data: {
          action: 'vehicle_price_updated',
          entityType: 'vehicle',
          entityId: vehicle.id,
          description: `Vehicle price updated: ${vehicle.make} ${vehicle.model} ${vehicle.year} (VIN: ${vehicle.vin}) - ${priceChangeDirection} from ${oldPriceFormatted} to ${newPriceFormatted} (${priceDiffPercent}%)`,
          metadata: {
            vin: metadata.vin,
            make: metadata.make,
            model: metadata.model,
            year: metadata.year,
            oldPrice: metadata.oldPrice,
            newPrice: metadata.newPrice,
            priceChange: metadata.priceChange,
            priceChangePercent: metadata.priceChangePercent,
            direction: metadata.direction,
            dataSource: metadata.dataSource,
            lastSync: metadata.lastSync,
            hoursStale: metadata.hoursStale,
            priceHistoryCount: metadata.priceHistoryCount,
          },
        },
      });
    } catch (error) {
      // Don't fail if logging fails
    }
  }

  /**
   * Log vehicle price refresh (unchanged) to ActivityLog
   */
  static async logPriceRefresh(
    vehicle: Vehicle,
    metadata: PriceRefreshMetadata
  ): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const priceFormatted = `$${metadata.price.toLocaleString()}`;

      await prisma.activityLog.create({
        data: {
          action: 'vehicle_price_refreshed',
          entityType: 'vehicle',
          entityId: vehicle.id,
          description: `Vehicle price refreshed: ${vehicle.make} ${vehicle.model} ${vehicle.year} (VIN: ${vehicle.vin}) - Price unchanged at ${priceFormatted}`,
          metadata: {
            vin: metadata.vin,
            make: metadata.make,
            model: metadata.model,
            year: metadata.year,
            price: metadata.price,
            dataSource: metadata.dataSource,
            lastSync: metadata.lastSync,
            hoursStale: metadata.hoursStale,
            status: metadata.status,
          },
        },
      });
    } catch (error) {
      // Don't fail if logging fails
    }
  }

  /**
   * Log vehicle price refresh failure to ActivityLog
   */
  static async logPriceRefreshFailed(
    vehicle: Vehicle,
    metadata: PriceRefreshFailedMetadata
  ): Promise<void> {
    try {
      const prisma = getPrismaClient();

      await prisma.activityLog.create({
        data: {
          action: 'vehicle_price_refresh_failed',
          entityType: 'vehicle',
          entityId: vehicle.id,
          description: `Failed to refresh price for ${vehicle.make} ${vehicle.model} ${vehicle.year} (VIN: ${vehicle.vin}) - ${metadata.error}`,
          metadata: {
            vin: metadata.vin,
            make: metadata.make,
            model: metadata.model,
            year: metadata.year,
            currentPrice: metadata.currentPrice,
            error: metadata.error,
            lastSync: metadata.lastSync,
            hoursStale: metadata.hoursStale,
            status: metadata.status,
          },
        },
      });
    } catch (error) {
      // Don't fail if logging fails
    }
  }
}

