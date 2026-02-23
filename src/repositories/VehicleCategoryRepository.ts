import { injectable } from 'inversify';
import prisma from '../db';
import { VehicleCategory, Prisma } from '../generated/prisma/client';

@injectable()
export class VehicleCategoryRepository {
  async findManyActive(): Promise<VehicleCategory[]> {
    return prisma.vehicleCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  async findMany(): Promise<VehicleCategory[]> {
    return prisma.vehicleCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  async findBySlug(slug: string): Promise<VehicleCategory | null> {
    return prisma.vehicleCategory.findUnique({
      where: { slug: slug.toLowerCase().trim(), isActive: true },
    });
  }

  async findById(id: string): Promise<VehicleCategory | null> {
    return prisma.vehicleCategory.findUnique({ where: { id } });
  }

  async create(data: Prisma.VehicleCategoryCreateInput): Promise<VehicleCategory> {
    return prisma.vehicleCategory.create({ data });
  }

  async update(id: string, data: Prisma.VehicleCategoryUpdateInput): Promise<VehicleCategory> {
    return prisma.vehicleCategory.update({ where: { id }, data });
  }

  async delete(id: string): Promise<VehicleCategory> {
    return prisma.vehicleCategory.delete({ where: { id } });
  }
}
