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

  // ─── Bank Transfer Evidence ───────────────────────────────────────────────

  async findOrCreateBankTransferPayment(orderId: string, userId: string, paymentType: string, amountUsd: number) {
    // Return existing open bank-transfer payment for this order if one exists
    const existing = await prisma.payment.findFirst({
      where: { orderId, userId, status: { in: ['PENDING', 'PROCESSING'] } },
      include: { order: { select: { id: true, requestNumber: true, status: true, userId: true } } },
    });
    if (existing) return existing;

    // Otherwise create a new one
    const ref = `AFZ-BT-${Date.now()}`;
    return prisma.payment.create({
      data: {
        orderId, userId,
        amountUsd,
        paymentType: paymentType as any,
        paymentMethod: 'BANK_TRANSFER',
        paymentProvider: 'bank_transfer',
        status: 'PENDING',
        transactionRef: ref,
      },
      include: { order: { select: { id: true, requestNumber: true, status: true, userId: true } } },
    });
  }

  saveEvidence(id: string, evidenceUrl: string, evidencePublicId: string) {
    return prisma.payment.update({
      where: { id },
      data: {
        evidenceUrl,
        evidencePublicId,
        evidenceUploadedAt: new Date(),
        status: 'PROCESSING',
        paymentMethod: 'BANK_TRANSFER',
      },
    });
  }

  saveEvidenceWithAmount(
    id: string,
    evidenceUrl: string,
    evidencePublicId: string,
    amountUsd?: number,
  ) {
    return prisma.payment.update({
      where: { id },
      data: {
        evidenceUrl,
        evidencePublicId,
        evidenceUploadedAt: new Date(),
        status: 'PROCESSING',
        paymentMethod: 'BANK_TRANSFER',
        ...(typeof amountUsd === 'number' && amountUsd > 0 ? { amountUsd } : {}),
      },
    });
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

  adminConfirmPayment(id: string, adminId: string, note?: string) {
    return prisma.payment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        escrowStatus: 'HELD',
        completedAt: new Date(),
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
