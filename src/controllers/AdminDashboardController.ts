import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../config/types';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { AdminDashboardService } from '../services/AdminDashboardService';

@injectable()
export class AdminDashboardController {
  constructor(
    @inject(TYPES.AdminDashboardService)
    private dashboardService: AdminDashboardService,
  ) {}

  getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await this.dashboardService.getDashboardStats();
    return res.status(200).json(ApiResponse.success(stats, 'Dashboard statistics retrieved'));
  });

  getPendingOrders = asyncHandler(async (req: Request, res: Response) => {
    const page  = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

    const result = await this.dashboardService.getPendingOrders(page, limit);

    return res.status(200).json(
      ApiResponse.paginated(
        result.orders,
        { page: result.page, limit: result.limit, total: result.total, pages: result.pages },
        'Pending orders retrieved',
      ),
    );
  });

  getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const activity = await this.dashboardService.getRecentActivity(limit);
    return res.status(200).json(ApiResponse.success(activity, 'Recent activity retrieved'));
  });
}
