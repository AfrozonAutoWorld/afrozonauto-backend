import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../config/types';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { NotificationService } from '../services/NotificationService';
import { NotificationType } from '../generated/prisma/enums';

@injectable()
export class NotificationController {
  constructor(
    @inject(TYPES.NotificationService)
    private notificationService: NotificationService,
  ) {}

  getStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await this.notificationService.getAdminStats();
    return res.status(200).json(ApiResponse.success(stats, 'Notification statistics retrieved'));
  });

  getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const page  = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    // Type filter
    const typeParam = (req.query.type as string)?.toUpperCase();
    const type =
      typeParam && typeParam !== 'ALL' && Object.values(NotificationType).includes(typeParam as NotificationType)
        ? (typeParam as NotificationType)
        : undefined;

    // Status filter: "pending" → isRead=false, "completed" → isRead=true, else undefined
    const statusParam = (req.query.status as string)?.toLowerCase();
    const isRead =
      statusParam === 'completed' ? true :
      statusParam === 'pending'   ? false :
      undefined;

    const result = await this.notificationService.getAdminNotifications({ type, isRead, page, limit });

    return res.status(200).json(
      ApiResponse.paginated(
        result.notifications,
        { page: result.page, limit: result.limit, total: result.total, pages: result.pages },
        'Notifications retrieved',
      ),
    );
  });

  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json(ApiError.badRequest('Notification ID is required'));
    }
    const updated = await this.notificationService.markAsRead(id);
    return res.status(200).json(ApiResponse.success(updated, 'Notification marked as read'));
  });

  markAllAsRead = asyncHandler(async (_req: Request, res: Response) => {
    const result = await this.notificationService.markAllAdminAsRead();
    return res.status(200).json(ApiResponse.success(result, 'All notifications marked as read'));
  });
}
