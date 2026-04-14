import { injectable } from 'inversify';
import prisma from '../db';
import { PaymentStatus, PaymentApprovalStatus } from '../generated/prisma/enums';

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
      const search = filters.search.trim();
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(search);
      where.OR = [
        { transactionRef: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        ...(isObjectId ? [
          { id: search },
          { orderId: search },
          { order: { vehicle: { userId: search } } }
        ] : []),
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

  // ─── Bank Transfer Evidence ───────────────────────────────────────────────

  async createBankTransferWithEvidence(data: {
    orderId: string,
    userId: string,
    paymentType: string,
    amountUsd: number,
    evidenceUrls: string[],
    evidencePublicIds: string[],
  }) {
    const ref = `AFZ-BT-${Date.now()}`;
    return prisma.payment.create({
      data: {
        orderId: data.orderId,
        userId: data.userId,
        amountUsd: data.amountUsd,
        paymentType: data.paymentType as any,
        paymentMethod: 'BANK_TRANSFER',
        paymentProvider: 'bank_transfer',
        status: 'PROCESSING',
        transactionRef: ref,
        evidenceUrls: data.evidenceUrls,
        evidencePublicIds: data.evidencePublicIds,
        evidenceUploadedAt: new Date(),
      },
      include: { 
        order: { select: { id: true, requestNumber: true, status: true, userId: true } },
        user: { select: { id: true, email: true, fullName: true } }
      },
    });
  }

  async getCompletedTotalUsdForOrder(orderId: string) {
    const result = await prisma.payment.aggregate({
      _sum: { amountUsd: true },
      where: {
        orderId,
        status: 'COMPLETED',
      },
    });

    return result._sum.amountUsd ?? 0;
  }

  async getCompletedDepositTotalUsdForOrder(orderId: string) {
    const result = await prisma.payment.aggregate({
      _sum: { amountUsd: true },
      where: {
        orderId,
        paymentType: 'DEPOSIT',
        status: 'COMPLETED',
      },
    });

    return result._sum.amountUsd ?? 0;
  }

  // ─── Admin Confirm / Reject ───────────────────────────────────────────────

  findPaymentWithOrder(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: { order: true, user: { select: { id: true, email: true, fullName: true } } },
    });
  }

  batchConfirmPayments(ids: string[], adminId: string, note?: string) {
    return prisma.payment.updateMany({
      where: { id: { in: ids } },
      data: {
        status: PaymentStatus.COMPLETED,
        approvalStatus: PaymentApprovalStatus.APPROVED,
        escrowStatus: 'HELD',
        completedAt: new Date(),
        adminConfirmedBy: adminId,
        adminConfirmedAt: new Date(),
        adminNote: note,
      },
    });
  }

  adminConfirmSinglePayment(id: string, adminId: string, note?: string) {
    return prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.COMPLETED,
        approvalStatus: PaymentApprovalStatus.APPROVED,
        escrowStatus: 'HELD',
        completedAt: new Date(),
        adminConfirmedBy: adminId,
        adminConfirmedAt: new Date(),
        adminNote: note,
      },
    });
  }

  adminUpdatePaymentStatus(id: string, adminId: string, status: PaymentStatus, note?: string) {
    const isCompleted = status === PaymentStatus.COMPLETED;
    return prisma.payment.update({
      where: { id },
      data: {
        status,
        escrowStatus: isCompleted ? 'HELD' : undefined,
        completedAt: isCompleted ? new Date() : undefined,
        adminConfirmedBy: adminId,
        adminConfirmedAt: new Date(),
        adminNote: note,
      },
    });
  }

  adminRejectPayment(id: string, adminId: string, note: string) {
    return prisma.payment.update({
      where: { id },
      data: {
        status: 'PENDING',
        approvalStatus: PaymentApprovalStatus.REJECTED,
        adminConfirmedBy: adminId,
        adminConfirmedAt: new Date(),
        adminNote: note,
      },
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
