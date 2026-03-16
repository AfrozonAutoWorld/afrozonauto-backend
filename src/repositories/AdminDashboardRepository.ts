import { injectable } from 'inversify';
import prisma from '../db';
import { OrderStatus, PaymentStatus } from '../generated/prisma/enums';

const PENDING_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING_QUOTE,
  OrderStatus.QUOTE_SENT,
  OrderStatus.QUOTE_ACCEPTED,
  OrderStatus.DEPOSIT_PENDING,
];

@injectable()
export class AdminDashboardRepository {

  // ─── Stats ────────────────────────────────────────────────────────────────

  async getDashboardStats() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers,
      totalCars,
      apiCars,
      totalOrders,
      pendingOrdersCount,
      revenueThisMonth,
      revenueLastMonth,
    ] = await Promise.all([
      // Total non-deleted users
      prisma.user.count({ where: { isDeleted: false } }),

      // Total vehicles
      prisma.vehicle.count(),

      // API-sourced vehicles (have an apiListingId)
      prisma.vehicle.count({ where: { apiListingId: { not: null } } }),

      // Total orders
      prisma.order.count(),

      // Pending orders
      prisma.order.count({ where: { status: { in: PENDING_ORDER_STATUSES } } }),

      // Revenue this month (completed payments)
      prisma.payment.aggregate({
        _sum: { amountUsd: true },
        where: {
          status: PaymentStatus.COMPLETED,
          completedAt: { gte: startOfThisMonth },
        },
      }),

      // Revenue last month
      prisma.payment.aggregate({
        _sum: { amountUsd: true },
        where: {
          status: PaymentStatus.COMPLETED,
          completedAt: { gte: startOfLastMonth, lt: startOfThisMonth },
        },
      }),
    ]);

    const thisMonthRevenue = revenueThisMonth._sum.amountUsd ?? 0;
    const lastMonthRevenue = revenueLastMonth._sum.amountUsd ?? 0;

    const revenueChangePercent =
      lastMonthRevenue === 0
        ? null
        : Number((((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1));

    // Total revenue (all time)
    const allTimeRevenue = await prisma.payment.aggregate({
      _sum: { amountUsd: true },
      where: { status: PaymentStatus.COMPLETED },
    });

    return {
      totalUsers,
      totalCars,
      carBreakdown: { api: apiCars, manual: totalCars - apiCars },
      totalOrders,
      pendingOrdersCount,
      totalRevenue: allTimeRevenue._sum.amountUsd ?? 0,
      revenueThisMonth: thisMonthRevenue,
      revenueLastMonth: lastMonthRevenue,
      revenueChangePercent,
    };
  }

  // ─── Pending Orders ───────────────────────────────────────────────────────

  async getPendingOrders(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { status: { in: PENDING_ORDER_STATUSES } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              thumbnail: true,
              priceUsd: true,
            },
          },
        },
      }),
      prisma.order.count({ where: { status: { in: PENDING_ORDER_STATUSES } } }),
    ]);

    return { orders, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── Recent Activity ──────────────────────────────────────────────────────

  async getRecentActivity(limit: number) {
    return prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }
}
