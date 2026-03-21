import { Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { RecommendedDefinitionRepository } from '../repositories/RecommendedDefinitionRepository';
import { AuthenticatedRequest } from '../types/customRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';


@injectable()
export class RecommendedDefinitionController {
  constructor(
    @inject(TYPES.RecommendedDefinitionRepository) private repo: RecommendedDefinitionRepository
  ) {}

  list = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const list = await this.repo.findMany();
    return res.json(ApiResponse.success(list, 'Recommended definitions retrieved'));
  });

  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const item = await this.repo.findById(id);
    if (!item) throw ApiError.notFound('Recommended definition not found');
    return res.json(ApiResponse.success(item, 'Recommended definition retrieved'));
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const { make, model, yearStart, yearEnd, reason, sortOrder, isActive, maxFetchCount } = req.body;
    if (!make || yearStart == null || yearEnd == null) {
      return res.status(400).json( 
        ApiError.badRequest('make, yearStart, yearEnd are required')
      )
    }
    const item = await this.repo.create({
      make,
      model: model ?? undefined,
      yearStart: Number(yearStart),
      yearEnd: Number(yearEnd),
      reason: reason ?? undefined,
      sortOrder: sortOrder != null ? Number(sortOrder) : 0,
      isActive: isActive !== false,
      maxFetchCount: maxFetchCount != null ? Number(maxFetchCount) : 2,
    });
    return res.status(201).json(ApiResponse.created(item, 'Recommended definition created'));
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const existing = await this.repo.findById(id);
    if (!existing) 
    {
      return res.status(400).json( ApiError.notFound('Recommended definition not found'))
    }
    const { make, model, yearStart, yearEnd, reason, sortOrder, isActive, maxFetchCount } = req.body;
    const item = await this.repo.update(id, {
      ...(make != null && { make }),
      ...(model !== undefined && { model }),
      ...(yearStart != null && { yearStart: Number(yearStart) }),
      ...(yearEnd != null && { yearEnd: Number(yearEnd) }),
      ...(reason !== undefined && { reason }),
      ...(sortOrder != null && { sortOrder: Number(sortOrder) }),
      ...(isActive !== undefined && { isActive: !!isActive }),
      ...(maxFetchCount != null && { maxFetchCount: Number(maxFetchCount) }),
    });
    return res.json(ApiResponse.success(item, 'Recommended definition updated'));
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const existing = await this.repo.findById(id);
    if (!existing) 
    {
      return res.status(400).json( ApiError.notFound('Recommended definition not found'))
    }
    await this.repo.delete(id);
    return res.json(ApiResponse.success(null, 'Recommended definition deleted'));
  });
}
