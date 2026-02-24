import { Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { TrendingDefinitionRepository } from '../repositories/TrendingDefinitionRepository';
import { AuthenticatedRequest } from '../types/customRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '../generated/prisma/client';

@injectable()
export class TrendingDefinitionController {
  constructor(
    @inject(TYPES.TrendingDefinitionRepository) private repo: TrendingDefinitionRepository
  ) {}

  list = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const list = await this.repo.findMany();
    return res.json(ApiResponse.success(list, 'Trending definitions retrieved'));
  });

  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const item = await this.repo.findById(id);
    if (!item) throw ApiError.notFound('Trending definition not found');
    return res.json(ApiResponse.success(item, 'Trending definition retrieved'));
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.role !== UserRole.OPERATIONS_ADMIN) {
      throw ApiError.forbidden('Admin only');
    }
    const { make, model, yearStart, yearEnd, label, sortOrder, isActive } = req.body;
    if (!make || yearStart == null || yearEnd == null) {
      throw ApiError.badRequest('make, yearStart, yearEnd are required');
    }
    const item = await this.repo.create({
      make,
      model: model ?? undefined,
      yearStart: Number(yearStart),
      yearEnd: Number(yearEnd),
      label: label ?? undefined,
      sortOrder: sortOrder != null ? Number(sortOrder) : 0,
      isActive: isActive !== false,
    });
    return res.status(201).json(ApiResponse.created(item, 'Trending definition created'));
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.role !== UserRole.OPERATIONS_ADMIN) {
      throw ApiError.forbidden('Admin only');
    }
    const { id } = req.params;
    const existing = await this.repo.findById(id);
    if (!existing) throw ApiError.notFound('Trending definition not found');
    const { make, model, yearStart, yearEnd, label, sortOrder, isActive } = req.body;
    const item = await this.repo.update(id, {
      ...(make != null && { make }),
      ...(model !== undefined && { model }),
      ...(yearStart != null && { yearStart: Number(yearStart) }),
      ...(yearEnd != null && { yearEnd: Number(yearEnd) }),
      ...(label !== undefined && { label }),
      ...(sortOrder != null && { sortOrder: Number(sortOrder) }),
      ...(isActive !== undefined && { isActive: !!isActive }),
    });
    return res.json(ApiResponse.success(item, 'Trending definition updated'));
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.role !== UserRole.OPERATIONS_ADMIN) {
      throw ApiError.forbidden('Admin only');
    }
    const { id } = req.params;
    const existing = await this.repo.findById(id);
    if (!existing) throw ApiError.notFound('Trending definition not found');
    await this.repo.delete(id);
    return res.json(ApiResponse.success(null, 'Trending definition deleted'));
  });
}
