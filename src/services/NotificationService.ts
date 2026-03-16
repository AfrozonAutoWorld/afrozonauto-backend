import { injectable, inject } from 'inversify';
import { TYPES } from '../config/types';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { NotificationType } from '../generated/prisma/enums';

@injectable()
export class NotificationService {
  constructor(
    @inject(TYPES.NotificationRepository)
    private repo: NotificationRepository,
  ) {}

  // ─── Admin list + stats ───────────────────────────────────────────────────

  async getAdminNotifications(filters: {
    type?: NotificationType;
    isRead?: boolean;
    page: number;
    limit: number;
  }) {
    const skip = (filters.page - 1) * filters.limit;
    const { notifications, total } = await this.repo.findAdminNotificationsPaginated(
      { type: filters.type, isRead: filters.isRead },
      { skip, take: filters.limit },
    );

    return {
      notifications,
      total,
      page: filters.page,
      limit: filters.limit,
      pages: Math.ceil(total / filters.limit),
    };
  }

  getAdminStats() {
    return this.repo.getAdminStats();
  }

  markAsRead(id: string) {
    return this.repo.markAsRead(id);
  }

  markAllAdminAsRead() {
    return this.repo.markAllAdminAsRead();
  }

  // ─── Trigger helpers (called from Order / Payment flows) ─────────────────

  async notifyAdminsOrderCreated(payload: {
    orderId: string;
    requestNumber: string;
    customerName: string;
    vehicleLabel: string;
    amountUsd?: number;
  }) {
    const admins = await this.repo.findAdminUserIds();
    await this.repo.createForAdmins(admins, {
      orderId: payload.orderId,
      type: NotificationType.ORDER_CREATED,
      title: 'New Order Placed',
      message: `Order ${payload.requestNumber} placed by ${payload.customerName} — ${payload.vehicleLabel}`,
      actionUrl: `/admin/orders/${payload.orderId}`,
    });
  }

  async notifyAdminsPaymentReceived(payload: {
    orderId?: string;
    orderRef: string;
    customerName: string;
    amountUsd: number;
  }) {
    const admins = await this.repo.findAdminUserIds();
    await this.repo.createForAdmins(admins, {
      orderId: payload.orderId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Payment Confirmed',
      message: `Payment of $${payload.amountUsd.toLocaleString()} received for Order #${payload.orderRef}`,
      actionUrl: payload.orderId ? `/admin/orders/${payload.orderId}` : undefined,
    });
  }
}
