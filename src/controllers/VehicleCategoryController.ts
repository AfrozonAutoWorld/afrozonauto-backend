import { Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { VehicleCategoryRepository } from '../repositories/VehicleCategoryRepository';
import { AuthenticatedRequest } from '../types/customRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '../generated/prisma/client';

@injectable()
export class VehicleCategoryController {
  constructor(
    @inject(TYPES.VehicleCategoryRepository) private repo: VehicleCategoryRepository
  ) {}

  list = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const list = await this.repo.findMany();
    return res.json(ApiResponse.success(list, 'Categories retrieved'));
  });

  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const item = await this.repo.findById(id);
    if (!item) throw ApiError.notFound('Category not found');
    return res.json(ApiResponse.success(item, 'Category retrieved'));
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.role !== UserRole.OPERATIONS_ADMIN) {
      throw ApiError.forbidden('Admin only');
    }
    const { slug, label, bodyStyle, fuel, luxuryMakes, priceMin, sortOrder, isActive } = req.body;
    if (!slug?.trim() || !label?.trim()) {
      throw ApiError.badRequest('slug and label are required');
    }
    const item = await this.repo.create({
      slug: String(slug).toLowerCase().trim(),
      label: String(label).trim(),
      bodyStyle: bodyStyle ?? undefined,
      fuel: fuel ?? undefined,
      luxuryMakes: Array.isArray(luxuryMakes) ? luxuryMakes : [],
      priceMin: priceMin != null ? Number(priceMin) : undefined,
      sortOrder: sortOrder != null ? Number(sortOrder) : 0,
      isActive: isActive !== false,
    });
    return res.status(201).json(ApiResponse.created(item, 'Category created'));
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.role !== UserRole.OPERATIONS_ADMIN) {
      throw ApiError.forbidden('Admin only');
    }
    const { id } = req.params;
    const existing = await this.repo.findById(id);
    if (!existing) throw ApiError.notFound('Category not found');
    const { slug, label, bodyStyle, fuel, luxuryMakes, priceMin, sortOrder, isActive } = req.body;
    const item = await this.repo.update(id, {
      ...(slug != null && { slug: String(slug).toLowerCase().trim() }),
      ...(label != null && { label: String(label).trim() }),
      ...(bodyStyle !== undefined && { bodyStyle: bodyStyle || null }),
      ...(fuel !== undefined && { fuel: fuel || null }),
      ...(luxuryMakes !== undefined && { luxuryMakes: Array.isArray(luxuryMakes) ? luxuryMakes : existing.luxuryMakes }),
      ...(priceMin !== undefined && { priceMin: priceMin == null ? null : Number(priceMin) }),
      ...(sortOrder != null && { sortOrder: Number(sortOrder) }),
      ...(isActive !== undefined && { isActive: !!isActive }),
    });
    return res.json(ApiResponse.success(item, 'Category updated'));
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.role !== UserRole.OPERATIONS_ADMIN) {
      throw ApiError.forbidden('Admin only');
    }
    const { id } = req.params;
    const existing = await this.repo.findById(id);
    if (!existing) throw ApiError.notFound('Category not found');
    await this.repo.delete(id);
    return res.json(ApiResponse.success(null, 'Category deleted'));
  });
}
