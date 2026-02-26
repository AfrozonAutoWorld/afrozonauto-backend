import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { VehicleCategoryRepository } from '../repositories/VehicleCategoryRepository';
import { Prisma, VehicleCategory } from '../generated/prisma/client';

@injectable()
export class CategoryService {
  constructor(
    @inject(TYPES.VehicleCategoryRepository) private categoryRepo: VehicleCategoryRepository
  ) {}

  async listCategories(): Promise<VehicleCategory[]> {
    return this.categoryRepo.findManyActive();
  }

  async listAllCategories(): Promise<VehicleCategory[]> {
    return this.categoryRepo.findMany();
  }

  async getBySlug(slug: string): Promise<VehicleCategory | null> {
    return this.categoryRepo.findBySlug(slug);
  }
  async getById(id: string): Promise<VehicleCategory | null> {
    return this.categoryRepo.findById(id);
  }
  async createCategory(body: Prisma.VehicleCategoryCreateInput): Promise<VehicleCategory | null> {
    return this.categoryRepo.create(body);
  }
  async updateCategory(id: string, body: Prisma.VehicleCategoryUpdateInput): Promise<VehicleCategory | null> {
    return this.categoryRepo.update(id, body);
  }
  async deleteCategory(id: string): Promise<VehicleCategory | null> {
    return this.categoryRepo.delete(id);
  } 
}
