import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { VehicleCategoryRepository } from '../repositories/VehicleCategoryRepository';
import { VehicleCategory } from '../generated/prisma/client';

@injectable()
export class CategoryService {
  constructor(
    @inject(TYPES.VehicleCategoryRepository) private categoryRepo: VehicleCategoryRepository
  ) {}

  async listCategories(): Promise<VehicleCategory[]> {
    return this.categoryRepo.findManyActive();
  }

  async getBySlug(slug: string): Promise<VehicleCategory | null> {
    return this.categoryRepo.findBySlug(slug);
  }

}
