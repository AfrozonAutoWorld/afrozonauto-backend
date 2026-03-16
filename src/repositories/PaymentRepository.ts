import { injectable } from 'inversify';
import prisma from '../db';
import { PaymentStatus } from '../generated/prisma/enums';

@injectable()
export class PaymentRepository {

  createPayment(data: any) {
    return prisma.payment.create({ data });
  }

  async findAdminPaginated(filters: {
    status?: PaymentStatus;
    search?: string;
  }, pagination: { skip: number; take: number }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { transactionRef: { contains: filters.search, mode: 'insensitive' } },
        { orderId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { order: true, user: { select: { id: true, email: true, fullName: true, profile: { select: { firstName: true, lastName: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total };
  }

  async getStats() {
    const [totalTransactions, revenueAgg, pendingCount, refundedAgg] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.aggregate({
        _sum: { amountUsd: true },
        where: { status: PaymentStatus.COMPLETED },
      }),
      prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      prisma.payment.aggregate({
        _sum: { amountUsd: true },
        where: { status: PaymentStatus.REFUNDED },
      }),
    ]);

    return {
      totalTransactions,
      totalRevenue: revenueAgg._sum.amountUsd ?? 0,
      pendingCount,
      totalRefunded: refundedAgg._sum.amountUsd ?? 0,
    };
  }

  updatePaymentByRef(reference: string, data: any) {
    return prisma.payment.update({
      where: { transactionRef: reference },
      data
    });
  }
  updatePayment(id: string, data: any) {
    return prisma.payment.update({
      where: { id },
      data
    });
  }
  

  findByReference(reference: string) {
    return prisma.payment.findFirst({
      where: { transactionRef: reference },
      include: { order: true }
    });
  }
  findById(id: string) {
    return prisma.payment.findFirst({
      where: { id },
      include: { order: true }
    });
  }
  findAll() {
    return prisma.payment.findMany({
      include: { order: true }
    });
  }
  findAllUserPayments(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      include: { order: true }
    });
  }

  
  updateByReference(transactionRef: string, data: any) {
    return prisma.payment.update({
      where: { transactionRef },
      data
    });
  }
  
//   markExpiredAsAbandoned(now: Date) {
//     return prisma.payment.updateMany({
//       where: {
//         status: 'PENDING',
//         expiresAt: { lt: now }
//       },
//       data: {
//         status: 'ABANDONED'
//       }
//     });
//   }
  
}
