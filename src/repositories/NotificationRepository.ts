import { injectable } from 'inversify';
import prisma from '../db';
import { NotificationType, UserRole } from '../generated/prisma/enums';

@injectable()
export class NotificationRepository {

  // ─── Admin user lookup (used internally) ─────────────────────────────────

  async findAdminUserIds(): Promise<{ id: string; email: string }[]> {
    return prisma.user.findMany({
      where: {
        role: { in: [UserRole.OPERATIONS_ADMIN, UserRole.SUPER_ADMIN] },
        isDeleted: false,
        isActive: true,
      },
      select: { id: true, email: true },
    });
  }

  // ─── Create notifications for all admins ─────────────────────────────────

  async createForAdmins(
    adminUsers: { id: string; email: string }[],
    data: {
      orderId?: string;
      type: NotificationType;
      title: string;
      message: string;
      actionUrl?: string;
      actionLabel?: string;
    },
  ) {
    if (adminUsers.length === 0) return;

    await prisma.notification.createMany({
      data: adminUsers.map((admin) => ({
        userId: admin.id,
        orderId: data.orderId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        // Store recipient email in actionLabel field for display
        actionLabel: admin.email,
        isRead: false,
      })),
    });
  }

  // ─── Paginated admin notifications (with recipient email) ─────────────────

  async findAdminNotificationsPaginated(
    filters: { type?: NotificationType; isRead?: boolean },
    pagination: { skip: number; take: number },
  ) {
    // Get all admin IDs
    const admins = await this.findAdminUserIds();
    const adminIds = admins.map((a) => a.id);
    const adminEmailMap = new Map(admins.map((a) => [a.id, a.email]));

    const where: any = { userId: { in: adminIds } };
    if (filters.type) where.type = filters.type;
    if (filters.isRead !== undefined) where.isRead = filters.isRead;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.notification.count({ where }),
    ]);

    // Attach recipient email (stored in actionLabel) to each notification
    const enriched = notifications.map((n) => ({
      ...n,
      recipientEmail: n.actionLabel ?? adminEmailMap.get(n.userId) ?? n.userId,
    }));

    return { notifications: enriched, total };
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  async getAdminStats() {
    const admins = await this.findAdminUserIds();
    const adminIds = admins.map((a) => a.id);

    const where = { userId: { in: adminIds } };

    const [totalSent, delivered, pending, orderAlerts] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: true } }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
      prisma.notification.count({
        where: { ...where, type: NotificationType.ORDER_CREATED },
      }),
    ]);

    return { totalSent, delivered, pending, orderAlerts };
  }

  // ─── Mark as read ─────────────────────────────────────────────────────────

  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAdminAsRead() {
    const admins = await this.findAdminUserIds();
    const adminIds = admins.map((a) => a.id);

    return prisma.notification.updateMany({
      where: { userId: { in: adminIds }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
