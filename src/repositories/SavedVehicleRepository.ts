import { injectable } from 'inversify';
import prisma from '../db';
import { Vehicle } from '../generated/prisma/client';

export interface SavedVehicleWithVehicle {
  vehicle: Vehicle;
  savedAt: Date;
}

@injectable()
export class SavedVehicleRepository {
  /**
   * Get vehicle IDs saved by a user (most recent first), for personalization.
   */
  async findVehicleIdsByUserId(userId: string, limit?: number): Promise<string[]> {
    const rows = await prisma.savedVehicle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      ...(limit != null && { take: limit }),
      select: { vehicleId: true },
    });
    return rows.map((r) => r.vehicleId);
  }

  /**
   * Get full saved vehicles for the user (for "Saved" tab / list).
   */
  async findSavedVehiclesByUserId(userId: string): Promise<SavedVehicleWithVehicle[]> {
    const rows = await prisma.savedVehicle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { vehicle: true },
    });
    return rows.map((r) => ({ vehicle: r.vehicle, savedAt: r.createdAt }));
  }

  async create(userId: string, vehicleId: string): Promise<{ id: string; createdAt: Date }> {
    const row = await prisma.savedVehicle.create({
      data: { userId, vehicleId },
      select: { id: true, createdAt: true },
    });
    return row;
  }

  async deleteByUserAndVehicle(userId: string, vehicleId: string): Promise<void> {
    await prisma.savedVehicle.deleteMany({
      where: { userId, vehicleId },
    });
  }

  async exists(userId: string, vehicleId: string): Promise<boolean> {
    const count = await prisma.savedVehicle.count({
      where: { userId, vehicleId },
    });
    return count > 0;
  }
}
