import { injectable } from 'inversify';
import prisma from '../db';
import { WithdrawalStatus } from '../generated/prisma/enums';

@injectable()
export class PayoutRepository {

  // ─── Bank Accounts ───────────────────────────────────────────────────────────

  async createBankAccount(data: {
    userId: string;
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    recipientCode: string;
    isDefault?: boolean;
  }) {
    // If this is the first account or marked as default, ensure only one default
    if (data.isDefault) {
      await prisma.bankAccount.updateMany({
        where: { userId: data.userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return prisma.bankAccount.create({ data });
  }

  async findBankAccountsByUser(userId: string) {
    return prisma.bankAccount.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findBankAccountById(id: string, userId: string) {
    return prisma.bankAccount.findFirst({
      where: { id, userId, isActive: true },
    });
  }

  async findBankAccountByRecipientCode(recipientCode: string) {
    return prisma.bankAccount.findUnique({ where: { recipientCode } });
  }

  async setDefaultBankAccount(id: string, userId: string) {
    await prisma.bankAccount.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
    return prisma.bankAccount.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async deactivateBankAccount(id: string, userId: string) {
    return prisma.bankAccount.updateMany({
      where: { id, userId },
      data: { isActive: false },
    });
  }

  async countUserBankAccounts(userId: string) {
    return prisma.bankAccount.count({ where: { userId, isActive: true } });
  }

  // ─── Withdrawal Requests ──────────────────────────────────────────────────────

  async createWithdrawal(data: {
    userId: string;
    bankAccountId: string;
    amountUsd: number;
    amountNgn: number;
    exchangeRate: number;
    reference: string;
    note?: string;
  }) {
    return prisma.withdrawalRequest.create({ data });
  }

  async findWithdrawalByReference(reference: string) {
    return prisma.withdrawalRequest.findUnique({
      where: { reference },
      include: { bankAccount: true, user: { select: { id: true, email: true, fullName: true } } },
    });
  }

  async updateWithdrawalByReference(reference: string, data: Partial<{
    status: WithdrawalStatus;
    paystackTransferCode: string;
    paystackTransferId: string;
    failureReason: string;
    processedAt: Date;
  }>) {
    return prisma.withdrawalRequest.update({ where: { reference }, data });
  }

  async findUserWithdrawals(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [withdrawals, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where: { userId },
        include: { bankAccount: { select: { bankName: true, accountNumber: true, accountName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.withdrawalRequest.count({ where: { userId } }),
    ]);
    return { withdrawals, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── User wallet ──────────────────────────────────────────────────────────────

  async getUserWalletBalance(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true, currency: true, payoutPinSet: true },
    });
    return user;
  }

  async deductWalletBalance(userId: string, amountUsd: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: amountUsd } },
    });
  }

  async restoreWalletBalance(userId: string, amountUsd: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: amountUsd } },
    });
  }

  // ─── Payout PIN ───────────────────────────────────────────────────────────────

  async setPayoutPin(userId: string, hashedPin: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { payoutPin: hashedPin, payoutPinSet: true },
    });
  }

  async getUserPayoutPin(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { payoutPin: true, payoutPinSet: true },
    });
  }
}
