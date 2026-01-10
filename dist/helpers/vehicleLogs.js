"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleLogs = void 0;
const prisma_1 = require("../db/prisma");
/**
 * Helper functions for logging vehicle-related activities to ActivityLog
 */
class VehicleLogs {
    /**
     * Log vehicle price update to ActivityLog
     */
    static logPriceUpdate(vehicle, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = (0, prisma_1.getPrismaClient)();
                const priceChangeDirection = metadata.direction;
                const oldPriceFormatted = `$${metadata.oldPrice.toLocaleString()}`;
                const newPriceFormatted = `$${metadata.newPrice.toLocaleString()}`;
                const priceDiffPercent = metadata.priceChangePercent.toFixed(2);
                yield prisma.activityLog.create({
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
            }
            catch (error) {
                // Don't fail if logging fails
            }
        });
    }
    /**
     * Log vehicle price refresh (unchanged) to ActivityLog
     */
    static logPriceRefresh(vehicle, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = (0, prisma_1.getPrismaClient)();
                const priceFormatted = `$${metadata.price.toLocaleString()}`;
                yield prisma.activityLog.create({
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
            }
            catch (error) {
                // Don't fail if logging fails
            }
        });
    }
    /**
     * Log vehicle price refresh failure to ActivityLog
     */
    static logPriceRefreshFailed(vehicle, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = (0, prisma_1.getPrismaClient)();
                yield prisma.activityLog.create({
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
            }
            catch (error) {
                // Don't fail if logging fails
            }
        });
    }
}
exports.VehicleLogs = VehicleLogs;
