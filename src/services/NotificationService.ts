import { injectable, inject } from 'inversify';
import { TYPES } from '../config/types';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { NotificationType } from '../generated/prisma/enums';
import { sendMail } from '../utils/mailer';

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

  async notifySellerPaymentComplete(payload: {
    userId: string;
    userEmail: string;
    orderId: string;
    orderRef: string;
    amountUsd: number;
    vehicleName: string;
  }) {
    // 1. Create In-App Notification
    await this.repo.createForUser(payload.userId, {
      orderId: payload.orderId,
      type: NotificationType.SYSTEM_ALERT,
      title: 'Vehicle Payment Completed',
      message: `Full payment has been completed for your vehicle ${payload.vehicleName} (Order #${payload.orderRef}).`,
      actionUrl: `/seller/orders/${payload.orderId}`,
    });

    // 2. Send email
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #2c3e50;">Payment Completed!</h2>
        <p>Hello,</p>
        <p>Great news! Full payment has been completed for your vehicle: <strong>${payload.vehicleName}</strong>.</p>
        <p><strong>Order Reference:</strong> ${payload.orderRef}</p>
        <p><strong>Amount:</strong> $${payload.amountUsd.toLocaleString()}</p>
        <p>Please log in to your seller dashboard to proceed with the next steps.</p>
        <br/>
        <a href="https://afrozonauto.com/seller/orders/${payload.orderId}" style="display: inline-block; padding: 10px 20px; font-weight: bold; color: #fff; background-color: #27ae60; text-decoration: none; border-radius: 5px;">View Order</a>
        <br/><br/>
        <p>Best regards,</p>
        <p>Afrozon AutoGlobal Team</p>
      </div>
    `;

    try {
        await sendMail(payload.userEmail, 'Vehicle Sold - Payment Completed', emailHtml);
    } catch (e) {
        // safe ignore wrapper to ensure in-app notification completes
    }
  }
}
